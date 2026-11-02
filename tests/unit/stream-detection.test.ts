import { describe, expect, it } from 'vitest';
import { detectStreamTypeFromUrl } from '../../src/utils/stream';

describe('Stream Type Detection from URL Extension', () => {
    it('detects HLS from .m3u8 extension with and without query params', () => {
        expect(detectStreamTypeFromUrl('https://example.com/live/playlist.m3u8')).toBe('hls');
        expect(detectStreamTypeFromUrl('https://example.com/live/playlist.m3u8?token=xyz123&exp=456')).toBe('hls');
        expect(detectStreamTypeFromUrl('https://example.com/stream.M3U8')).toBe('hls');
        expect(detectStreamTypeFromUrl('https://example.com/stream.hls')).toBe('hls');
    });

    it('detects MP3 from .mp3 extension', () => {
        expect(detectStreamTypeFromUrl('https://example.com/audio/radio.mp3')).toBe('mp3');
        expect(detectStreamTypeFromUrl('http://icecast.org/live.mp3?key=abc#fragment')).toBe('mp3');
        expect(detectStreamTypeFromUrl('https://example.com/live.MP3/')).toBe('mp3');
    });

    it('detects AAC from .aac and .m4a extensions', () => {
        expect(detectStreamTypeFromUrl('https://example.com/stream.aac')).toBe('aac');
        expect(detectStreamTypeFromUrl('https://example.com/stream.m4a?auth=1')).toBe('aac');
        expect(detectStreamTypeFromUrl('https://example.com/stream.AAC')).toBe('aac');
    });

    it('detects OGG from .ogg, .opus, and .oga extensions', () => {
        expect(detectStreamTypeFromUrl('https://example.com/stream.ogg')).toBe('ogg');
        expect(detectStreamTypeFromUrl('https://example.com/stream.opus')).toBe('ogg');
        expect(detectStreamTypeFromUrl('https://example.com/stream.oga')).toBe('ogg');
    });

    it('returns null for URLs without file extensions (/stream, /live, port mounts, etc.)', () => {
        expect(detectStreamTypeFromUrl('http://stream.pramborsfm.com:8000/live')).toBeNull();
        expect(detectStreamTypeFromUrl('https://stream-relay-geo.ntslive.net/stream')).toBeNull();
        expect(detectStreamTypeFromUrl('http://103.28.219.100:8000/;')).toBeNull();
        expect(detectStreamTypeFromUrl('https://streaming.radios.pt/antena1')).toBeNull();
        expect(detectStreamTypeFromUrl('http://example.com:8000/listen')).toBeNull();
        expect(detectStreamTypeFromUrl('')).toBeNull();
        expect(detectStreamTypeFromUrl('   ')).toBeNull();
        expect(detectStreamTypeFromUrl(null as unknown as string)).toBeNull();
    });
});
