import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { isValidStreamUrl, StreamType } from '../stations/station.model';
import {
    parseM3uPlaylist,
    parsePlsPlaylist
} from '../stations/playlist-parser';

export interface StreamTestResult {
    ok: boolean;
    resolvedUrl: string;
    streamType: StreamType;
    contentType: string;
    icyName?: string;
    bitrate?: string;
    latencyMs: number;
    errorReason?: string;
    noiceCatalogInfo?: {
        title?: string;
        logoUrl?: string;
    };
}

/**
 * If the user pastes an open.noice.id/catalog/... link, automatically extract
 * the underlying HLS radio_stream_url and metadata from the catalog page.
 */
export async function resolveSpecialCatalogUrl(inputUrl: string): Promise<{
    streamUrl: string;
    title?: string;
    logoUrl?: string;
}> {
    const trimmed = inputUrl.trim();
    if (!trimmed.includes('open.noice.id/catalog/')) {
        return { streamUrl: trimmed };
    }

    return new Promise((resolve) => {
        const req = https.get(
            trimmed,
            {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Squelch/0.1.0'
                },
                timeout: 8000
            },
            (res) => {
                if ((res.statusCode ?? 0) >= 300 && res.headers.location) {
                    res.resume();
                    resolve({ streamUrl: trimmed });
                    return;
                }
                const chunks: Buffer[] = [];
                res.on('data', (c: Buffer) => chunks.push(c));
                res.on('end', () => {
                    const html = Buffer.concat(chunks).toString('utf8');
                    const streamMatch =
                        /"radio_stream_url"\s*:\s*"([^"]+)"/.exec(html);
                    const titleMatch = /"og_title"\s*:\s*"([^"]+)"/.exec(html);
                    const imageMatch = /"og_image"\s*:\s*"([^"]+)"/.exec(html);

                    if (streamMatch && streamMatch[1]) {
                        resolve({
                            streamUrl: streamMatch[1],
                            title: titleMatch?.[1],
                            logoUrl: imageMatch?.[1]
                        });
                    } else {
                        resolve({ streamUrl: trimmed });
                    }
                });
            }
        );
        req.on('error', () => resolve({ streamUrl: trimmed }));
        req.on('timeout', () => {
            req.destroy();
            resolve({ streamUrl: trimmed });
        });
    });
}

export function detectStreamType(
    url: string,
    contentType: string,
    initialBytes?: Buffer
): StreamType {
    const lowerUrl = url.toLowerCase();
    const lowerCt = contentType.toLowerCase();
    const sampleText = initialBytes
        ? initialBytes.subarray(0, 64).toString('utf8')
        : '';

    if (
        lowerCt.includes('mpegurl') ||
        lowerUrl.includes('.m3u8') ||
        sampleText.includes('#EXTM3U')
    ) {
        return 'hls';
    }
    if (
        lowerCt.includes('aac') ||
        lowerCt.includes('aacp') ||
        lowerCt.includes('mp4') ||
        lowerUrl.endsWith('.aac')
    ) {
        return 'aac';
    }
    if (
        lowerCt.includes('ogg') ||
        lowerCt.includes('opus') ||
        lowerCt.includes('vorbis') ||
        lowerUrl.endsWith('.ogg') ||
        sampleText.startsWith('OggS')
    ) {
        return 'ogg';
    }
    return 'mp3';
}

export async function testAndInspectStream(
    rawUrl: string,
    timeoutMs = 8000,
    redirectDepth = 0
): Promise<StreamTestResult> {
    const startTime = Date.now();

    if (redirectDepth > 5) {
        return {
            ok: false,
            resolvedUrl: rawUrl,
            streamType: 'mp3',
            contentType: '',
            latencyMs: Date.now() - startTime,
            errorReason: 'Too many redirects'
        };
    }

    const catalogResolved = await resolveSpecialCatalogUrl(rawUrl);
    const targetUrl = catalogResolved.streamUrl;

    if (!isValidStreamUrl(targetUrl)) {
        return {
            ok: false,
            resolvedUrl: targetUrl,
            streamType: 'mp3',
            contentType: '',
            latencyMs: Date.now() - startTime,
            errorReason:
                'Invalid URL scheme (only http:// and https:// are allowed)'
        };
    }

    return new Promise((resolve) => {
        let settled = false;
        const finish = (res: StreamTestResult) => {
            if (settled) return;
            settled = true;
            if (catalogResolved.title || catalogResolved.logoUrl) {
                res.noiceCatalogInfo = {
                    title: catalogResolved.title,
                    logoUrl: catalogResolved.logoUrl
                };
            }
            resolve(res);
        };

        const parsed = new URL(targetUrl);
        const client = parsed.protocol === 'https:' ? https : http;

        const req = client.request(
            parsed,
            {
                method: 'GET',
                headers: {
                    'User-Agent': 'Squelch/0.1.0 (macOS)',
                    'Icy-MetaData': '1',
                    Accept: '*/*'
                },
                timeout: timeoutMs
            },
            (res) => {
                const status = res.statusCode ?? 0;

                if (status >= 300 && status < 400 && res.headers.location) {
                    res.resume();
                    const nextUrl = new URL(
                        res.headers.location,
                        parsed
                    ).toString();
                    void testAndInspectStream(
                        nextUrl,
                        timeoutMs,
                        redirectDepth + 1
                    ).then(finish);
                    return;
                }

                if (status < 200 || status >= 300) {
                    res.resume();
                    finish({
                        ok: false,
                        resolvedUrl: targetUrl,
                        streamType: 'mp3',
                        contentType: '',
                        latencyMs: Date.now() - startTime,
                        errorReason: `HTTP status ${status}`
                    });
                    return;
                }

                const rawCt =
                    (res.headers['content-type'] as string) || 'audio/mpeg';
                const contentType = rawCt.split(';')[0].trim().toLowerCase();
                const icyName =
                    (res.headers['icy-name'] as string | undefined) ||
                    catalogResolved.title;
                const bitrate = res.headers['icy-br'] as string | undefined;

                const chunks: Buffer[] = [];
                let totalBytes = 0;

                res.on('data', (chunk: Buffer) => {
                    chunks.push(chunk);
                    totalBytes += chunk.length;

                    const combined = Buffer.concat(chunks);
                    const textHead = combined.subarray(0, 512).toString('utf8');

                    // Check if it is a .pls or non-HLS .m3u playlist wrapper that needs resolving
                    if (
                        (targetUrl.toLowerCase().endsWith('.pls') ||
                            contentType.includes('scpls') ||
                            textHead
                                .trim()
                                .toLowerCase()
                                .startsWith('[playlist]')) &&
                        totalBytes >= 64
                    ) {
                        req.destroy();
                        const entries = parsePlsPlaylist(
                            combined.toString('utf8')
                        );
                        if (entries.length > 0 && redirectDepth < 3) {
                            void testAndInspectStream(
                                entries[0].streamUrl,
                                timeoutMs,
                                redirectDepth + 1
                            ).then(finish);
                            return;
                        }
                    }

                    const isHlsManifest =
                        textHead.includes('#EXT-X-STREAM-INF') ||
                        textHead.includes('#EXT-X-TARGETDURATION') ||
                        targetUrl.toLowerCase().includes('.m3u8');

                    if (
                        !isHlsManifest &&
                        (targetUrl.toLowerCase().endsWith('.m3u') ||
                            textHead.trim().startsWith('#EXTM3U')) &&
                        totalBytes >= 64
                    ) {
                        const entries = parseM3uPlaylist(
                            combined.toString('utf8')
                        );
                        if (
                            entries.length > 0 &&
                            entries[0].streamUrl.startsWith('http') &&
                            redirectDepth < 3
                        ) {
                            req.destroy();
                            void testAndInspectStream(
                                entries[0].streamUrl,
                                timeoutMs,
                                redirectDepth + 1
                            ).then(finish);
                            return;
                        }
                    }

                    if (isHlsManifest && totalBytes >= 24) {
                        req.destroy();
                        finish({
                            ok: true,
                            resolvedUrl: targetUrl,
                            streamType: 'hls',
                            contentType,
                            icyName,
                            bitrate,
                            latencyMs: Date.now() - startTime
                        });
                        return;
                    }

                    if (totalBytes >= 2048) {
                        req.destroy();
                        const detected = detectStreamType(
                            targetUrl,
                            contentType,
                            combined
                        );
                        finish({
                            ok: true,
                            resolvedUrl: targetUrl,
                            streamType: detected,
                            contentType,
                            icyName,
                            bitrate,
                            latencyMs: Date.now() - startTime
                        });
                    }
                });

                res.on('end', () => {
                    const combined = Buffer.concat(chunks);
                    if (totalBytes > 24) {
                        const detected = detectStreamType(
                            targetUrl,
                            contentType,
                            combined
                        );
                        finish({
                            ok: true,
                            resolvedUrl: targetUrl,
                            streamType: detected,
                            contentType,
                            icyName,
                            bitrate,
                            latencyMs: Date.now() - startTime
                        });
                    } else {
                        finish({
                            ok: false,
                            resolvedUrl: targetUrl,
                            streamType: 'mp3',
                            contentType,
                            latencyMs: Date.now() - startTime,
                            errorReason: `Stream ended prematurely (${totalBytes} bytes)`
                        });
                    }
                });

                res.on('error', (err) => {
                    finish({
                        ok: false,
                        resolvedUrl: targetUrl,
                        streamType: 'mp3',
                        contentType,
                        latencyMs: Date.now() - startTime,
                        errorReason: err.message
                    });
                });
            }
        );

        req.on('timeout', () => {
            req.destroy();
            finish({
                ok: false,
                resolvedUrl: targetUrl,
                streamType: 'mp3',
                contentType: '',
                latencyMs: Date.now() - startTime,
                errorReason: 'Connection timeout'
            });
        });

        req.on('error', (err) => {
            finish({
                ok: false,
                resolvedUrl: targetUrl,
                streamType: 'mp3',
                contentType: '',
                latencyMs: Date.now() - startTime,
                errorReason: err.message
            });
        });

        req.end();
    });
}
