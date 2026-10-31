import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';

interface CandidateStation {
  id: string;
  name: string;
  streamUrl: string;
  streamType: 'mp3' | 'aac' | 'ogg' | 'hls';
  logoUrl: string | null;
  genre: string;
  city: string;
  country: string;
  tags: string[];
  group: string;
  isFavorite: boolean;
}

const MANUAL_CANDIDATES: CandidateStation[] = [
  {
    id: 'jak-101-fm-jakarta',
    name: 'Jak 101 FM Jakarta',
    streamUrl: 'https://wz.mari.co.id:1936/noice_jakfm/jakfm/playlist.m3u8',
    streamType: 'hls',
    logoUrl: 'https://images.noiceid.cc/catalog/content-1614529857498.jpg',
    genre: 'Pop / Adult Contemporary',
    city: 'Jakarta',
    country: 'ID',
    tags: ['pop', 'hits', 'jakarta', 'noice'],
    group: 'Pop & Anak Muda',
    isFavorite: true
  },
  {
    id: 'gen-987-fm-jakarta',
    name: 'Gen 98.7 FM Jakarta',
    streamUrl: 'https://wz.mari.co.id:1936/noice_genfm/genfm/playlist.m3u8',
    streamType: 'hls',
    logoUrl: null,
    genre: 'Pop / Top 40',
    city: 'Jakarta',
    country: 'ID',
    tags: ['pop', 'indonesia', 'jakarta'],
    group: 'Pop & Anak Muda',
    isFavorite: true
  },
  {
    id: 'kis-951-fm-jakarta',
    name: 'Kis 95.1 FM Jakarta',
    streamUrl: 'https://wz.mari.co.id:1936/noice_kisfm/kisfm/playlist.m3u8',
    streamType: 'hls',
    logoUrl: null,
    genre: 'Pop / Love Songs',
    city: 'Jakarta',
    country: 'ID',
    tags: ['pop', 'romantis', 'jakarta'],
    group: 'Pop & Anak Muda',
    isFavorite: false
  },
  {
    id: 'most-1058-fm-jakarta',
    name: 'Most Radio 105.8 FM',
    streamUrl: 'https://wz.mari.co.id:1936/noice_mostfm/mostfm/playlist.m3u8',
    streamType: 'hls',
    logoUrl: null,
    genre: '80s / 90s / Classic Hits',
    city: 'Jakarta',
    country: 'ID',
    tags: ['80s', '90s', 'nostalgia', 'jakarta'],
    group: 'Lainnya & Nostalgia',
    isFavorite: false
  },
  {
    id: 'mustang-88-fm-jakarta',
    name: 'Mustang 88 FM Jakarta',
    streamUrl:
      'https://wz.mari.co.id:1936/noice_mustangfm/mustangfm/playlist.m3u8',
    streamType: 'hls',
    logoUrl: null,
    genre: 'Top 40 / Hits',
    city: 'Jakarta',
    country: 'ID',
    tags: ['anak muda', 'top40', 'jakarta'],
    group: 'Pop & Anak Muda',
    isFavorite: false
  },
  {
    id: 'hot-932-fm-jakarta',
    name: 'Hot 93.2 FM Jakarta',
    streamUrl: 'https://wz.mari.co.id:1936/noice_hotfm/hotfm/playlist.m3u8',
    streamType: 'hls',
    logoUrl: null,
    genre: 'Dangdut / Pop Indonesia',
    city: 'Jakarta',
    country: 'ID',
    tags: ['dangdut', 'indonesia', 'jakarta'],
    group: 'Lainnya & Nostalgia',
    isFavorite: false
  },
  {
    id: 'gen-1031-fm-surabaya',
    name: 'Gen 103.1 FM Surabaya',
    streamUrl: 'https://wz.mari.co.id:1936/noice_gensby/gensby/playlist.m3u8',
    streamType: 'hls',
    logoUrl: null,
    genre: 'Pop / Top 40',
    city: 'Surabaya',
    country: 'ID',
    tags: ['pop', 'surabaya', 'anak muda'],
    group: 'Pop & Anak Muda',
    isFavorite: false
  },
  {
    id: 'prambors-fm-jakarta',
    name: 'Prambors FM 102.2 Jakarta',
    streamUrl: 'https://s2.cloudmu.id/listen/prambors/radio.mp3',
    streamType: 'mp3',
    logoUrl: null,
    genre: 'Pop / Youth Hits',
    city: 'Jakarta',
    country: 'ID',
    tags: ['pop', 'top40', 'anak muda'],
    group: 'Pop & Anak Muda',
    isFavorite: true
  },
  {
    id: 'delta-fm-jakarta',
    name: 'Delta FM Jakarta',
    streamUrl: 'https://s2.cloudmu.id/listen/delta_fm/radio.mp3',
    streamType: 'mp3',
    logoUrl: null,
    genre: 'Adult Contemporary',
    city: 'Jakarta',
    country: 'ID',
    tags: ['pop', 'hits', 'jakarta'],
    group: 'Pop & Anak Muda',
    isFavorite: false
  },
  {
    id: 'female-radio-jakarta',
    name: 'Female Radio 97.9 FM',
    streamUrl: 'https://s2.cloudmu.id/listen/female_radio/radio.mp3',
    streamType: 'mp3',
    logoUrl: null,
    genre: 'Pop / Lifestyle',
    city: 'Jakarta',
    country: 'ID',
    tags: ['pop', 'lifestyle', 'jakarta'],
    group: 'Pop & Anak Muda',
    isFavorite: false
  },
  {
    id: 'bahana-fm-jakarta',
    name: 'Bahana FM 101.8 Jakarta',
    streamUrl: 'https://s2.cloudmu.id/listen/bahana_fm/radio.mp3',
    streamType: 'mp3',
    logoUrl: null,
    genre: 'Pop / Urban',
    city: 'Jakarta',
    country: 'ID',
    tags: ['pop', 'jakarta'],
    group: 'Pop & Anak Muda',
    isFavorite: false
  }
];

function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'SquelchSeedVerifier/0.1.0'
        },
        timeout: 10000
      },
      (res) => {
        if ((res.statusCode ?? 0) !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as T);
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Timeout')));
  });
}

function testStreamCandidate(url: string): Promise<{
  ok: boolean;
  streamType?: 'mp3' | 'aac' | 'ogg' | 'hls';
  contentType?: string;
  reason?: string;
}> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (res: {
      ok: boolean;
      streamType?: 'mp3' | 'aac' | 'ogg' | 'hls';
      contentType?: string;
      reason?: string;
    }) => {
      if (settled) return;
      settled = true;
      resolve(res);
    };

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      finish({ ok: false, reason: 'Invalid URL' });
      return;
    }

    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(
      parsed,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Squelch/0.1.0',
          Accept: '*/*'
        },
        timeout: 7000
      },
      (res) => {
        const code = res.statusCode ?? 0;
        if (code >= 300 && code < 400 && res.headers.location) {
          res.resume();
          const next = new URL(res.headers.location, parsed).toString();
          testStreamCandidate(next).then(finish);
          return;
        }
        if (code < 200 || code >= 300) {
          res.resume();
          finish({ ok: false, reason: `HTTP ${code}` });
          return;
        }

        const ct = (
          (res.headers['content-type'] as string) || ''
        ).toLowerCase();
        let bytesRead = 0;

        res.on('data', (chunk: Buffer) => {
          bytesRead += chunk.length;
          const isM3u8 =
            ct.includes('mpegurl') ||
            url.toLowerCase().includes('.m3u8') ||
            chunk.toString('utf8', 0, 16).includes('#EXTM3U');

          if (isM3u8 && bytesRead >= 24) {
            req.destroy();
            finish({ ok: true, streamType: 'hls', contentType: ct });
          } else if (bytesRead >= 2048) {
            req.destroy();
            let streamType: 'mp3' | 'aac' | 'ogg' | 'hls' = 'mp3';
            if (ct.includes('aac') || ct.includes('mp4')) streamType = 'aac';
            else if (ct.includes('ogg') || ct.includes('opus'))
              streamType = 'ogg';
            finish({ ok: true, streamType, contentType: ct });
          }
        });

        res.on('end', () => {
          if (bytesRead > 32) {
            finish({ ok: true, streamType: 'hls', contentType: ct });
          } else {
            finish({ ok: false, reason: `Ended early (${bytesRead} bytes)` });
          }
        });

        res.on('error', (err) => {
          finish({ ok: false, reason: err.message });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      finish({ ok: false, reason: 'Timeout' });
    });

    req.on('error', (err) => {
      finish({ ok: false, reason: err.message });
    });

    req.end();
  });
}

interface RadioBrowserStation {
  stationuuid: string;
  name: string;
  url_resolved: string;
  favicon: string;
  tags: string;
  state: string;
  codec: string;
  votes: number;
}

async function runVerification() {
  console.log('Fetching Indonesian stations from radio-browser.info...');
  let apiStations: RadioBrowserStation[] = [];
  const mirrors = [
    'https://de1.api.radio-browser.info',
    'https://fi1.api.radio-browser.info',
    'https://at1.api.radio-browser.info'
  ];

  for (const host of mirrors) {
    try {
      apiStations = await fetchJson<RadioBrowserStation[]>(
        `${host}/json/stations/search?countrycode=ID&hidebroken=true&order=votes&reverse=true&limit=65`
      );
      if (apiStations.length > 0) {
        console.log(`Fetched ${apiStations.length} candidates from ${host}`);
        break;
      }
    } catch (e) {
      console.warn(`Mirror ${host} failed:`, e);
    }
  }

  const allCandidates: CandidateStation[] = [...MANUAL_CANDIDATES];
  const seenUrls = new Set(allCandidates.map((c) => c.streamUrl.toLowerCase()));
  const seenNames = new Set(allCandidates.map((c) => c.name.toLowerCase()));

  for (const item of apiStations) {
    const cleanUrl = (item.url_resolved || '').trim();
    const cleanName = (item.name || '').trim().replace(/\s+/g, ' ');
    if (!cleanUrl.startsWith('http') || !cleanName) continue;
    if (
      seenUrls.has(cleanUrl.toLowerCase()) ||
      seenNames.has(cleanName.toLowerCase())
    ) {
      continue;
    }

    seenUrls.add(cleanUrl.toLowerCase());
    seenNames.add(cleanName.toLowerCase());

    const tags = item.tags
      ? item.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 4)
      : ['indonesia'];

    const lowerNameAndTags = `${cleanName} ${tags.join(' ')}`.toLowerCase();
    let group = 'Daerah & Komunitas';
    if (
      lowerNameAndTags.includes('rri') ||
      lowerNameAndTags.includes('elshinta') ||
      lowerNameAndTags.includes('suara surabaya') ||
      lowerNameAndTags.includes('berita') ||
      lowerNameAndTags.includes('news') ||
      lowerNameAndTags.includes('smart') ||
      lowerNameAndTags.includes('sonora')
    ) {
      group = 'Nasional & Berita';
    } else if (
      lowerNameAndTags.includes('pop') ||
      lowerNameAndTags.includes('top 40') ||
      lowerNameAndTags.includes('hits') ||
      lowerNameAndTags.includes('prambors') ||
      lowerNameAndTags.includes('hard rock') ||
      lowerNameAndTags.includes('ardan') ||
      lowerNameAndTags.includes('trax') ||
      lowerNameAndTags.includes('iradio')
    ) {
      group = 'Pop & Anak Muda';
    } else if (
      lowerNameAndTags.includes('islam') ||
      lowerNameAndTags.includes('muslim') ||
      lowerNameAndTags.includes('dakwah') ||
      lowerNameAndTags.includes('rodja') ||
      lowerNameAndTags.includes('rohani')
    ) {
      group = 'Religi & Rohani';
    }

    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);

    allCandidates.push({
      id: `${slug}-${item.stationuuid.slice(0, 6)}`,
      name: cleanName,
      streamUrl: cleanUrl,
      streamType: cleanUrl.includes('.m3u8') ? 'hls' : 'mp3',
      logoUrl:
        item.favicon && item.favicon.startsWith('http') ? item.favicon : null,
      genre: tags[0]
        ? tags[0].charAt(0).toUpperCase() + tags[0].slice(1)
        : 'Radio',
      city: item.state || 'Indonesia',
      country: 'ID',
      tags,
      group,
      isFavorite: false
    });
  }

  const verified: Array<
    CandidateStation & { lastVerifiedAt: string; status: 'online' }
  > = [];
  const failed: Array<{ name: string; url: string; reason: string }> = [];
  const nowIso = new Date().toISOString();

  console.log(`Testing ${allCandidates.length} candidate streams...`);

  for (const cand of allCandidates) {
    if (verified.length >= 28) break;
    const res = await testStreamCandidate(cand.streamUrl);
    if (res.ok && res.streamType) {
      verified.push({
        ...cand,
        streamType: res.streamType,
        lastVerifiedAt: nowIso,
        status: 'online'
      });
      console.log(
        `  [OK] ${cand.name} (${res.streamType}) -> ${cand.streamUrl}`
      );
    } else {
      failed.push({
        name: cand.name,
        url: cand.streamUrl,
        reason: res.reason || 'Failed verification'
      });
      console.log(`  [FAIL] ${cand.name}: ${res.reason}`);
    }
  }

  const seedPayload = {
    schemaVersion: 1,
    groups: [
      'Pop & Anak Muda',
      'Nasional & Berita',
      'Lainnya & Nostalgia',
      'Daerah & Komunitas',
      'Religi & Rohani'
    ],
    stations: verified
  };

  const outSeedPath = path.resolve(
    __dirname,
    '../resources/stations.seed.json'
  );
  fs.writeFileSync(outSeedPath, JSON.stringify(seedPayload, null, 2), 'utf8');

  const reportLines = [
    '# Laporan Verifikasi Seed Stasiun Radio Indonesia',
    '',
    `- **Tanggal Verifikasi:** ${nowIso}`,
    `- **Total Stasiun Lolos Verifikasi:** ${verified.length}`,
    `- **Total Stasiun Gagal Verifikasi:** ${failed.length}`,
    '',
    '## 1. Stasiun Lolos Verifikasi (Dimasukkan ke `stations.seed.json`)',
    '',
    '| # | Nama Stasiun | Kota | Kategori | Tipe | Stream URL |',
    '| :- | :--- | :--- | :--- | :--- | :--- |',
    ...verified.map(
      (s, idx) =>
        `| ${idx + 1} | **${s.name}** | ${s.city} | ${s.group} | \`${s.streamType}\` | \`${s.streamUrl}\` |`
    ),
    '',
    '## 2. Stasiun Gagal Verifikasi (Tidak Dimasukkan ke Seed)',
    '',
    '| # | Nama Stasiun | Stream URL | Alasan Gagal |',
    '| :- | :--- | :--- | :--- |',
    ...failed.map(
      (f, idx) => `| ${idx + 1} | ${f.name} | \`${f.url}\` | ${f.reason} |`
    )
  ];

  const outReportPath = path.resolve(
    __dirname,
    '../resources/stations.seed-report.md'
  );
  fs.writeFileSync(outReportPath, reportLines.join('\n'), 'utf8');

  console.log(`\nSaved ${verified.length} verified stations to ${outSeedPath}`);
  console.log(`Saved verification report to ${outReportPath}`);
}

void runVerification();
