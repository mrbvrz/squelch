import type { StreamType } from '../types';

/**
 * Detect stream audio type from a URL file extension.
 * If the URL ends with a recognizable audio extension (.mp3, .m3u8, .aac, .ogg, etc.),
 * returns the corresponding StreamType.
 * If the URL has no file extension (e.g. mountpoints like /stream, /live, /;), returns null.
 */
export function detectStreamTypeFromUrl(rawUrl: string): StreamType | null {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;

    // Strip query strings and hash anchors, then remove trailing slashes
    const cleanUrl = trimmed.split(/[?#]/)[0].replace(/\/+$/, '');

    // Check known audio stream extensions (case-insensitive)
    if (/\.m3u8$/i.test(cleanUrl) || /\.hls$/i.test(cleanUrl)) return 'hls';
    if (/\.mp3$/i.test(cleanUrl)) return 'mp3';
    if (/\.(aac|m4a)$/i.test(cleanUrl)) return 'aac';
    if (/\.(ogg|opus|oga)$/i.test(cleanUrl)) return 'ogg';

    return null;
}
