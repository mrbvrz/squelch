# Laporan Verifikasi Seed Stasiun Radio Indonesia

- **Tanggal Verifikasi:** 2026-10-31T16:23:50.065Z
- **Total Stasiun Lolos Verifikasi:** 28
- **Total Stasiun Gagal Verifikasi:** 5

## 1. Stasiun Lolos Verifikasi (Dimasukkan ke `stations.seed.json`)

| # | Nama Stasiun | Kota | Kategori | Tipe | Stream URL |
| :- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Jak 101 FM Jakarta** | Jakarta | Pop & Anak Muda | `hls` | `https://wz.mari.co.id:1936/noice_jakfm/jakfm/playlist.m3u8` |
| 2 | **Gen 98.7 FM Jakarta** | Jakarta | Pop & Anak Muda | `hls` | `https://wz.mari.co.id:1936/noice_genfm/genfm/playlist.m3u8` |
| 3 | **Kis 95.1 FM Jakarta** | Jakarta | Pop & Anak Muda | `hls` | `https://wz.mari.co.id:1936/noice_kisfm/kisfm/playlist.m3u8` |
| 4 | **Most Radio 105.8 FM** | Jakarta | Lainnya & Nostalgia | `hls` | `https://wz.mari.co.id:1936/noice_mostfm/mostfm/playlist.m3u8` |
| 5 | **Mustang 88 FM Jakarta** | Jakarta | Pop & Anak Muda | `hls` | `https://wz.mari.co.id:1936/noice_mustangfm/mustangfm/playlist.m3u8` |
| 6 | **Hot 93.2 FM Jakarta** | Jakarta | Lainnya & Nostalgia | `hls` | `https://wz.mari.co.id:1936/noice_hotfm/hotfm/playlist.m3u8` |
| 7 | **I-Radio Jakarta** | Jakarta | Pop & Anak Muda | `mp3` | `http://stream.radiojar.com/4ywdgup3bnzuv` |
| 8 | **RDI 97.1 FM** | Jakarta | Daerah & Komunitas | `mp3` | `http://202.147.199.99:8000/;stream/1` |
| 9 | **Suara Giri 98.4 FM** | Indonesia | Pop & Anak Muda | `mp3` | `http://streaming.girifm.com:8010/` |
| 10 | **elshinta jakarta** | Indonesia | Nasional & Berita | `mp3` | `https://stream-ssl.arenastreaming.com:8000/jakarta` |
| 11 | **Wijaya FM 103.5 FM Surabaya** | Jawa Timur | Daerah & Komunitas | `aac` | `http://wijayafm.onlivestreaming.net:9880/stream?` |
| 12 | **Retjo Buntung 99.4 FM** | Yogyakarta | Daerah & Komunitas | `mp3` | `http://45.64.97.82:9940/` |
| 13 | **Radio Dangdut 97.1 FM Jakarta** | Indonesia | Daerah & Komunitas | `mp3` | `http://202.147.199.99:8000/;` |
| 14 | **89.2 FM Jakarta, Campur sari** | Indonesia | Daerah & Komunitas | `aac` | `https://a8.siar.us/listen/campursari/stream` |
| 15 | **Hardrock 87.6 FM Jakarta** | Indonesia | Daerah & Komunitas | `mp3` | `http://stream.radiojar.com/7csmg90fuqruv` |
| 16 | **Suara Surabaya FM** | Indonesia | Nasional & Berita | `aac` | `https://c5.siar.us/proxy/ssfm/stream` |
| 17 | **CNN Indonesia** | Indonesia | Nasional & Berita | `hls` | `https://live.cnnindonesia.com/livecnn/smil:cnntv/chunklist.m3u8` |
| 18 | **Suara Muslim Surabaya** | Indonesia | Religi & Rohani | `mp3` | `http://pu.klikhost.com:8052/` |
| 19 | **EL SHADDAI FM SOLO** | Solo | Daerah & Komunitas | `mp3` | `http://shaddai.onlivestreaming.net:9130/live` |
| 20 | **V Radio** | Jakarta | Daerah & Komunitas | `mp3` | `http://202.147.199.100:8000/;stream.nsv` |
| 21 | **RRI Pro 3 KBRN** | Indonesia | Nasional & Berita | `aac` | `https://stream-node0.rri.co.id/streaming/14/9014/kbrn.mp3` |
| 22 | **98,4 Suara Giri FM Gresik** | Indonesia | Daerah & Komunitas | `mp3` | `http://streaming.girifm.com:8010/;stream.nsv` |
| 23 | **Iradio FM** | Indonesia | Pop & Anak Muda | `mp3` | `http://n03.radiojar.com/4ywdgup3bnzuv` |
| 24 | **95.1 Kiss FM** | Indonesia | Pop & Anak Muda | `hls` | `http://103.246.184.62:1935/noice_kisfm/kisfm/chunklist.m3u8` |
| 25 | **Sindo Trijaya 104.6 FM Jakarta** | Jakarta | Daerah & Komunitas | `mp3` | `http://202.147.199.101:8000/;stream.nsv` |
| 26 | **SB FM tembang kenangan** | parepare | Pop & Anak Muda | `mp3` | `https://stream.zeno.fm/d16n50mkzhhvv` |
| 27 | **M-Stream Indo** | Bandung | Pop & Anak Muda | `aac` | `https://stream.zeno.fm/iln4upodbvuuv` |
| 28 | **Dangdut2** | Indonesia | Daerah & Komunitas | `mp3` | `https://stream.zeno.fm/vwhplynnpfjtv` |

## 2. Stasiun Gagal Verifikasi (Tidak Dimasukkan ke Seed)

| # | Nama Stasiun | Stream URL | Alasan Gagal |
| :- | :--- | :--- | :--- |
| 1 | Gen 103.1 FM Surabaya | `https://wz.mari.co.id:1936/noice_gensby/gensby/playlist.m3u8` | HTTP 404 |
| 2 | Prambors FM 102.2 Jakarta | `https://s2.cloudmu.id/listen/prambors/radio.mp3` | getaddrinfo ENOTFOUND s2.cloudmu.id |
| 3 | Delta FM Jakarta | `https://s2.cloudmu.id/listen/delta_fm/radio.mp3` | getaddrinfo ENOTFOUND s2.cloudmu.id |
| 4 | Female Radio 97.9 FM | `https://s2.cloudmu.id/listen/female_radio/radio.mp3` | getaddrinfo ENOTFOUND s2.cloudmu.id |
| 5 | Bahana FM 101.8 Jakarta | `https://s2.cloudmu.id/listen/bahana_fm/radio.mp3` | getaddrinfo ENOTFOUND s2.cloudmu.id |