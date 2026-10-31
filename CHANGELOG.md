# Catatan Rilis / Changelog

Semua perubahan penting pada proyek **Squelch** didokumentasikan dalam berkas ini.
Format ini mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.0.0/) dan mematuhi [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v0.1.0] - 2026-11-01

### Ditambahkan (Added)

- **Menu Bar Tray Popover & macOS HUD Glass Bento UI**:
  - Tampilan popover menu bar dengan efek native macOS HUD Vibrancy (`backdrop-filter: blur(24px) saturate(180%)`).
  - Animasi ikon waveform 5-bar SDF (_Signed Distance Fields_) pre-rendered 12-frame di menu bar tanpa konsumsi CPU berlebih saat siaran aktif.
  - Tombol kontrol pemutar berbentuk lingkaran penuh (_circle_) untuk Play/Pause dan Stop.
- **Dukungan Audio Multi-Codec & ICY StreamTitle**:
  - Pemutar audio headless worker mendukung format MP3, AAC/HE-AAC, OGG/Opus, dan HLS (`.m3u8`).
  - Server proxy lokal `127.0.0.1` untuk ekstraksi ICY Metadata secara real-time tanpa distorsi audio.
  - Resolver otomatis untuk playlist stream `.m3u`, `.pls`, dan URL katalog Noice (`open.noice.id`).
- **Jadwal Siaran & Pengingat Otomatis (Show Schedules & Reminders)**:
  - Manajemen jadwal siaran radio favorit (contoh: _Sarapan Seru_ di Jak 101 FM, Senin–Jumat 06:00–10:00).
  - Background scheduler engine yang memeriksa jadwal secara real-time.
  - Notifikasi sistem bawaan (tepat waktu siaran, 5 menit sebelumnya, atau 10 menit sebelumnya).
  - Opsi _Autoplay_ untuk memutar stasiun radio secara otomatis saat jam acara dimulai.
  - Indikator live status _Sedang Mengudara_ dan pengalihan status cepat.
- **Pencarian Cepat & Navigasi**:
  - Kolom pencarian stasiun dengan badge pintasan keyboard `⌘F` (macOS) / `Ctrl+F` (Windows/Linux) dan auto-focus global listener.
  - Mini player terintegrasi pada sidebar kiri tepat di bawah kolom pencarian.
  - Navigasi cepat ke tab _Stasiun Radio_, _Jadwal Siaran_, _Direktori Online_, _Aktivitas Dengar_, _Pengaturan_, dan _Tentang_.
- **Direktori Radio Terbuka (Online Discovery)**:
  - Pencarian katalog global stasiun radio internet dari `radio-browser.info` dengan failover multi-mirror otomatis.
  - Dropdown negara lengkap dengan bendera emoji dan pencarian instan.
- **Statistik Durasi Mendengarkan (Listening Tracker)**:
  - Pelacakan durasi mendengarkan radio terinci secara Mingguan, Bulanan, dan Tahunan dengan visualisasi grafik batang interaktif.
- **Personalisasi & Preferensi**:
  - Pilihan tema (Sistem, Gelap, Terang) dengan kartu pratinjau visual.
  - 8 pilihan warna aksen (_macOS Accent Colors_).
  - Pilihan font sistem fleksibel.
  - Pencadangan dan pemulihan data lokal (_Backup & Restore_).
  - Konfirmasi pengembalian ke pengaturan awal (_Reset to Default_).
  - Konfirmasi dialog sebelum keluar dari aplikasi.
- **Lokalisasi Dwibahasa (i18n)**:
  - Dukungan lengkap Bahasa Indonesia dan Bahasa Inggris dengan selector dropdown berbendera.
