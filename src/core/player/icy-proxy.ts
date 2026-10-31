import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

export interface IcyMetadataEvent {
  raw: string;
  streamTitle: string | null;
}

export interface IcyProxyOptions {
  userAgent?: string;
  timeoutMs?: number;
  maxRedirects?: number;
  onMetadata?: (meta: IcyMetadataEvent) => void;
  onStreamConnected?: (info: { contentType: string; isHls: boolean }) => void;
  onStreamError?: (error: Error) => void;
}

/**
 * Parses an ICY metadata block (e.g., "StreamTitle='Artist - Song';StreamUrl='';")
 */
export function parseIcyMetadataBlock(buffer: Buffer): IcyMetadataEvent {
  // Trim trailing null bytes
  let end = buffer.length;
  while (end > 0 && buffer[end - 1] === 0) {
    end--;
  }
  const raw = buffer.subarray(0, end).toString('utf8').trim();
  const match = /StreamTitle='([^']*?)'(?:;|$)/i.exec(raw);
  const streamTitle = match && match[1] ? match[1].trim() : null;
  return { raw, streamTitle: streamTitle || null };
}

/**
 * Stateful byte-level demuxer that strips ICY metadata blocks every `metaint` bytes
 * and emits clean audio bytes so the audio decoder never plays metadata as noise.
 */
export class IcyStreamDemuxer {
  private readonly metaint: number;
  private readonly onAudioChunk: (chunk: Buffer) => void;
  private readonly onMetadata: (meta: IcyMetadataEvent) => void;

  private audioBytesRemaining: number;
  private readingLengthByte = false;
  private metaBytesRemaining = 0;
  private metaBuffer: Buffer = Buffer.alloc(0);

  constructor(
    metaint: number,
    onAudioChunk: (chunk: Buffer) => void,
    onMetadata: (meta: IcyMetadataEvent) => void
  ) {
    this.metaint = metaint;
    this.audioBytesRemaining = metaint;
    this.onAudioChunk = onAudioChunk;
    this.onMetadata = onMetadata;
  }

  public push(chunk: Buffer): void {
    let offset = 0;

    while (offset < chunk.length) {
      if (this.readingLengthByte) {
        const lengthSpecifier = chunk[offset];
        offset += 1;
        this.readingLengthByte = false;
        this.metaBytesRemaining = lengthSpecifier * 16;

        if (this.metaBytesRemaining === 0) {
          this.audioBytesRemaining = this.metaint;
        } else {
          this.metaBuffer = Buffer.alloc(0);
        }
        continue;
      }

      if (this.metaBytesRemaining > 0) {
        const toCopy = Math.min(this.metaBytesRemaining, chunk.length - offset);
        this.metaBuffer = Buffer.concat([
          this.metaBuffer,
          chunk.subarray(offset, offset + toCopy)
        ]);
        offset += toCopy;
        this.metaBytesRemaining -= toCopy;

        if (this.metaBytesRemaining === 0) {
          try {
            const parsed = parseIcyMetadataBlock(this.metaBuffer);
            if (parsed.streamTitle) {
              this.onMetadata(parsed);
            }
          } catch {
            // Ignore malformed metadata block without interrupting audio
          }
          this.audioBytesRemaining = this.metaint;
        }
        continue;
      }

      // Reading audio bytes
      const toSend = Math.min(this.audioBytesRemaining, chunk.length - offset);
      if (toSend > 0) {
        this.onAudioChunk(chunk.subarray(offset, offset + toSend));
        offset += toSend;
        this.audioBytesRemaining -= toSend;
      }

      if (this.audioBytesRemaining === 0) {
        this.readingLengthByte = true;
      }
    }
  }
}

/**
 * Local loopback HTTP server (127.0.0.1) that proxies upstream radio streams,
 * extracts ICY metadata headers in Node.js, and feeds clean audio bytes to HTML5 <audio>.
 */
export class LocalIcyProxyServer {
  private server: http.Server | null = null;
  private port = 0;
  private activeUpstreamReq: http.ClientRequest | null = null;
  private currentTargetUrl: string | null = null;
  private options: IcyProxyOptions = {};

  public async start(): Promise<number> {
    if (this.server && this.port > 0) {
      return this.port;
    }

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleClientRequest(req, res);
      });

      this.server.on('error', (err) => {
        reject(err);
      });

      this.server.listen(0, '127.0.0.1', () => {
        const addr = this.server?.address();
        if (addr && typeof addr === 'object') {
          this.port = addr.port;
          resolve(this.port);
        } else {
          reject(new Error('Failed to bind local ICY proxy server'));
        }
      });
    });
  }

  public getProxyUrlFor(
    targetUrl: string,
    options: IcyProxyOptions = {}
  ): string {
    this.currentTargetUrl = targetUrl;
    this.options = options;
    return `http://127.0.0.1:${this.port}/stream?t=${Date.now()}`;
  }

  public abortActiveStream(): void {
    if (this.activeUpstreamReq) {
      this.activeUpstreamReq.destroy();
      this.activeUpstreamReq = null;
    }
  }

  public async stop(): Promise<void> {
    this.abortActiveStream();
    if (!this.server) return;
    return new Promise((resolve) => {
      this.server?.close(() => {
        this.server = null;
        this.port = 0;
        resolve();
      });
    });
  }

  private handleClientRequest(
    _clientReq: http.IncomingMessage,
    clientRes: http.ServerResponse
  ): void {
    this.abortActiveStream();

    if (!this.currentTargetUrl) {
      clientRes.writeHead(404);
      clientRes.end('No stream configured');
      return;
    }

    this.connectUpstream(this.currentTargetUrl, clientRes, 0);
  }

  private connectUpstream(
    targetUrl: string,
    clientRes: http.ServerResponse,
    redirectCount: number
  ): void {
    const maxRedirects = this.options.maxRedirects ?? 5;
    if (redirectCount > maxRedirects) {
      const err = new Error('Too many redirects');
      this.options.onStreamError?.(err);
      if (!clientRes.headersSent) {
        clientRes.writeHead(502);
      }
      clientRes.end();
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      const err = new Error(`Invalid stream URL: ${targetUrl}`);
      this.options.onStreamError?.(err);
      if (!clientRes.headersSent) {
        clientRes.writeHead(400);
      }
      clientRes.end();
      return;
    }

    const client = parsedUrl.protocol === 'https:' ? https : http;
    const timeoutMs = this.options.timeoutMs ?? 12000;
    const userAgent =
      this.options.userAgent ?? 'Squelch/0.1.0 (macOS; AudioStreamPlayer)';

    const req = client.request(
      parsedUrl,
      {
        method: 'GET',
        headers: {
          'Icy-MetaData': '1',
          'User-Agent': userAgent,
          Accept: '*/*',
          Connection: 'keep-alive'
        },
        timeout: timeoutMs
      },
      (upRes) => {
        const statusCode = upRes.statusCode ?? 0;

        if (statusCode >= 300 && statusCode < 400 && upRes.headers.location) {
          upRes.resume();
          const nextUrl = new URL(upRes.headers.location, parsedUrl).toString();
          this.connectUpstream(nextUrl, clientRes, redirectCount + 1);
          return;
        }

        if (statusCode < 200 || statusCode >= 300) {
          upRes.resume();
          const err = new Error(`Upstream HTTP status ${statusCode}`);
          this.options.onStreamError?.(err);
          if (!clientRes.headersSent) {
            clientRes.writeHead(502);
          }
          clientRes.end();
          return;
        }

        const rawContentType =
          (upRes.headers['content-type'] as string | undefined) ?? 'audio/mpeg';
        const contentType = rawContentType.split(';')[0].trim().toLowerCase();
        const isHls =
          contentType.includes('mpegurl') ||
          parsedUrl.pathname.toLowerCase().endsWith('.m3u8');

        this.options.onStreamConnected?.({ contentType, isHls });

        if (!clientRes.headersSent) {
          clientRes.writeHead(200, {
            'Content-Type':
              contentType === 'application/octet-stream'
                ? 'audio/mpeg'
                : contentType,
            'Cache-Control': 'no-cache, no-store',
            'Access-Control-Allow-Origin': '*',
            Connection: 'keep-alive'
          });
        }

        const metaintHeader = upRes.headers['icy-metaint'];
        const metaint =
          typeof metaintHeader === 'string' ? parseInt(metaintHeader, 10) : NaN;

        if (!isNaN(metaint) && metaint > 0) {
          const demuxer = new IcyStreamDemuxer(
            metaint,
            (audioChunk) => {
              if (!clientRes.writableEnded) {
                clientRes.write(audioChunk);
              }
            },
            (meta) => {
              this.options.onMetadata?.(meta);
            }
          );

          upRes.on('data', (chunk: Buffer) => {
            demuxer.push(chunk);
          });
        } else {
          upRes.on('data', (chunk: Buffer) => {
            if (!clientRes.writableEnded) {
              clientRes.write(chunk);
            }
          });
        }

        upRes.on('end', () => {
          if (!clientRes.writableEnded) {
            clientRes.end();
          }
        });

        upRes.on('error', (err) => {
          this.options.onStreamError?.(err);
          if (!clientRes.writableEnded) {
            clientRes.end();
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('Stream connection timeout'));
    });

    req.on('error', (err) => {
      if (!clientRes.writableEnded) {
        clientRes.end();
      }
      this.options.onStreamError?.(err);
    });

    clientRes.on('close', () => {
      if (!req.destroyed) {
        req.destroy();
      }
    });

    this.activeUpstreamReq = req;
    req.end();
  }
}
