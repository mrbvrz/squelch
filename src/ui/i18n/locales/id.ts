import { TranslationDictionary } from '../types';

export const idLocale: TranslationDictionary = {
    // Navigation & Tabs
    tabStations: 'Stasiun Radio',
    tabSchedules: 'Jadwal Siaran',
    tabDiscover: 'Direktori Online',
    tabStats: 'Statistik Dengar',
    tabPreferences: 'Pengaturan',
    tabAbout: 'Tentang Aplikasi',

    // Sidebar & Status
    searchPlaceholder: 'Cari stasiun, genre, kota…',
    quitAppBtn: 'Keluar Squelch',
    statusLiveSub: 'Mengudara',
    statusConnectingSub: 'Menghubungkan',
    statusBufferingSub: 'Memuat Buffer',
    statusReconnectingSub: 'Menyambung Ulang',
    statusPausedSub: 'Dijeda',
    statusOfflineSub: 'Terputus',
    statusStandbySub: 'Siaga',

    // Tray Popover
    traySignalTitle: 'SINYAL',
    traySignalStreaming: 'Streaming',
    traySignalReady: 'Siaga',
    traySleepTitle: 'TIDUR',
    traySleepOff: 'Mati',
    trayNowPlaying: 'Sedang Diputar',
    trayDefaultGroup: 'Siaran Indonesia',
    traySelectPrompt: 'Pilih Stasiun Radio',
    trayClickStationHint: 'Klik salah satu stasiun di bawah',
    trayAllFilter: 'Semua',
    trayFavFilter: 'Favorit',
    traySearchPlaceholder: 'Cari stasiun (Jak, Gen, RRI, Elshinta)…',
    trayAddStation: 'Tambah Siaran',
    trayDiscover: 'Direktori',
    traySettings: 'Pengaturan',
    trayQuit: 'Keluar',
    trayStatStations: 'Stasiun',
    trayStatFavorites: 'Favorit',
    trayStatCategories: 'Kategori',

    // Manage Stations Tab
    allStationsTitle: 'Semua Stasiun',
    favoritesTitle: 'Favorit',
    receiverIdleTitle: 'Squelch Receiver',
    receiverPlayingPrefix: 'Memutar:',
    receiverConnectedDesc:
        'Terhubung ke siaran langsung. Gunakan sakelar di kanan untuk menjeda atau melanjutkan pemutaran.',
    receiverIdleDesc:
        'Pilih stasiun dari daftar di bawah untuk memutar siaran langsung dari menu bar.',
    allGroups: 'Semua',
    favoritesOnly: 'Favorit',
    addGroupBtn: '+ Kategori',
    addGroupTitle: 'Tambah Kategori Siaran',
    addGroupPlaceholder: 'Nama kategori baru…',
    saveGroupBtn: 'Simpan',
    deleteGroupBtn: 'Hapus kategori',
    hideOffline: 'Sembunyikan Offline',
    healthCheck: 'Periksa Stream',
    checkingHealth: 'Memeriksa…',
    removeOffline: 'Hapus Offline',
    importExport: 'Impor / Ekspor',
    addStation: 'Tambah Stasiun',
    emptyStationsText: 'Tidak ada stasiun yang cocok dengan filter saat ini.',
    emptyStationsTitle: 'Belum Ada Stasiun Radio',
    emptyStationsDesc:
        'Tambahkan stasiun streaming radio favorit Anda atau jelajahi ribuan siaran gratis di direktori online.',
    emptyStationsDiscoverBtn: 'Jelajahi Direktori Online',
    connectedBadge: 'Terhubung',
    play: 'Putar',
    stop: 'Berhenti',
    edit: 'Ubah',
    delete: 'Hapus',

    // Schedules & Reminders Tab
    schedulesTitle: 'Jadwal Siaran & Pengingat',
    schedulesSubtitle:
        'Simpan jadwal acara siaran favorit Anda. Squelch akan mengirimkan notifikasi dan dapat memutar siaran secara otomatis saat acara dimulai.',
    addScheduleBtn: 'Tambah Jadwal Siaran',
    modalAddScheduleTitle: 'Tambah Jadwal Acara Radio',
    modalEditScheduleTitle: 'Ubah Jadwal Acara Radio',
    scheduleShowName: 'Nama Acara Siaran',
    scheduleHost: 'Nama Penyiar / Host',
    scheduleStation: 'Stasiun Radio',
    scheduleDays: 'Hari Siaran',
    scheduleTimeRange: 'Jam Tayang (WIB / Waktu Lokal)',
    scheduleStartTime: 'Jam Mulai',
    scheduleEndTime: 'Jam Selesai',
    scheduleAutoPlay: 'Putar Otomatis (Autoplay)',
    scheduleAutoPlayDesc:
        'Otomatis menyetel dan memutar siaran ini saat jam tayang dimulai',
    scheduleReminder: 'Waktu Pengingat',
    scheduleReminderAtStart: 'Tepat saat siaran dimulai',
    scheduleReminder5m: '5 Menit sebelumnya',
    scheduleReminder10m: '10 Menit sebelumnya',
    scheduleNotes: 'Catatan / Deskripsi Acara',
    scheduleEmptyText: 'Belum ada jadwal siaran yang ditambahkan.',
    scheduleOnAirNow: 'Sedang Mengudara',
    scheduleDaysWeekdays: 'Senin - Jumat',
    scheduleDaysAll: 'Setiap Hari',
    schedulePlayNow: 'Putar Sekarang',

    // Discover Tab
    discoverTitle: 'Direktori Radio Publik',
    discoverSubtitle:
        'Cari dan tambahkan stasiun radio internet dari direktori terbuka radio-browser.info.',
    discoverSearchBtn: 'Cari',
    discoverLoadingBtn: 'Mencari…',
    discoverGlobalFilter: 'Global (Semua Negara)',
    discoverName: 'Nama stasiun…',
    discoverTag: 'Genre / tag…',
    discoverAvailableHeader: 'Stasiun Tersedia',
    discoverPreviewBtn: 'Pratinjau',
    discoverAddBtn: '+ Tambah',
    discoverAdded: 'Tersimpan',

    // Listening Stats Tab (Mingguan, Bulanan, Tahunan)
    statsTitle: 'Aktivitas Mendengarkan',
    statsSubtitle:
        'Catatan durasi mendengarkan radio mingguan, bulanan, tahunan, dan stasiun terpopuler Anda.',
    statsWeekLabel: 'Minggu Ini',
    statsMonthLabel: 'Bulan Ini',
    statsYearLabel: 'Tahun Ini',
    statsChartTitle: 'Grafik Durasi Mendengarkan',
    statsWeeklyView: 'Mingguan',
    statsMonthlyView: 'Bulanan',
    statsYearlyView: 'Tahunan',
    statsTopStationsTitle: 'Stasiun Paling Sering Didengar',
    statsEmptyText:
        'Belum ada riwayat durasi mendengarkan. Putar stasiun radio untuk mulai mencatat statistik.',

    // Preferences Tab
    prefSubtitle:
        'Sesuaikan tema visual, warna aksen, tipografi, rekoneksi jaringan, cadangan data, dan pintasan global.',
    prefAppearanceSection: 'Tampilan & Personalisasi',
    prefThemeLabel: 'Tema Jendela',
    prefThemeSystem: 'Sistem',
    prefThemeLight: 'Terang',
    prefThemeDark: 'Gelap',
    prefAccentLabel: 'Warna Aksen',
    prefGlassOpacityLabel: 'Ketebalan Latar Glass',
    prefGlassOpacityDesc: 'Tingkat opasitas jendela dan menu tray (bawaan 90%)',
    prefFontFamilyLabel: 'Jenis Huruf (Font)',
    prefFontFamilyDesc: 'Gunakan font sistem bawaan atau pilih font terinstal',
    prefFontSystemDefault: 'Font Sistem Bawaan (SF Pro / Segoe UI)',
    prefGeneral: 'Umum & Perilaku',
    prefLanguage: 'Bahasa Antarmuka',
    prefLaunchAtLogin: 'Jalankan saat login sistem',
    prefAutoPlay: 'Putar otomatis stasiun terakhir saat dibuka',
    prefNotifySong: 'Notifikasi sistem saat judul lagu berganti',
    prefConfirmQuit: 'Tampilkan konfirmasi sebelum keluar aplikasi',
    prefAudioNet: 'Audio & Jaringan',
    prefAutoReconnect: 'Sambung ulang otomatis saat jaringan terputus',
    prefMaxRetries: 'Batas percobaan rekoneksi',
    prefTimeout: 'Batas waktu jaringan (Timeout)',
    prefShortcuts: 'Pintasan Keyboard Global',
    prefShortcutRecordHint:
        'Klik tombol pintasan lalu tekan kombinasi tombol baru (Esc untuk batal)',
    prefShortcutRecording: 'Tekan tombol…',
    prefShortcutPlayPause: 'Putar / Jeda Siaran',
    prefShortcutNext: 'Stasiun Berikutnya',
    prefShortcutPrev: 'Stasiun Sebelumnya',
    prefBackupSection: 'Cadangkan & Pulihkan Data',
    prefBackupTitle: 'Cadangan Stasiun & Pengaturan',
    prefBackupDesc:
        'Ekspor seluruh stasiun, kategori, preferensi, dan riwayat dengar ke file JSON atau pulihkan dari cadangan.',
    prefBackupBtn: 'Buat Cadangan…',
    prefRestoreBtn: 'Pulihkan Cadangan…',
    prefBackupSuccess: 'Cadangan berhasil disimpan.',
    prefRestoreSuccess: 'Data cadangan berhasil dipulihkan.',
    prefDiagSection: 'Diagnostik & Log Sistem',
    prefDiagDesc:
        'Informasi direktori penyimpanan lokal dan catatan log operasional aplikasi.',
    prefDiagShowBtn: 'Tampilkan Laporan Diagnostik',
    prefDiagHideBtn: 'Sembunyikan Laporan Diagnostik',
    prefDataDirLabel: 'Direktori data',
    prefDangerSection: 'Atur Ulang Pengaturan',
    prefResetDesc:
        'Kembalikan seluruh preferensi tampilan, jaringan, dan pintasan keyboard ke pengaturan awal.',
    prefResetBtn: 'Kembalikan Bawaan',
    prefResetConfirmTitle: 'Kembalikan Pengaturan Awal?',
    prefResetConfirmDesc:
        'Semua kustomisasi tema, warna aksen, font, dan pintasan keyboard akan dikembalikan ke nilai bawaan.',
    prefResetConfirmYes: 'Ya, Kembalikan Bawaan',

    // About & Diagnostics
    aboutTagline: 'Pemutar Radio Internet Menu Bar Modern & Ringan',
    aboutDescription:
        'Dirancang untuk mendengarkan siaran radio langsung dari menu bar tanpa membebani sistem. Mendukung aliran MP3, AAC/HE-AAC, OGG/Opus, dan HLS (.m3u8) dengan ekstraksi ICY metadata lokal, statistik durasi dengar, serta integrasi direktori publik.',
    aboutWebsiteBtn: 'Situs Web',
    aboutSpecLink: 'Spesifikasi & Arsitektur',
    aboutChangelogLink: 'Catatan Rilis (Changelog)',
    aboutShowSpecsBtn: 'Lihat Spesifikasi & Arsitektur',
    aboutHideSpecsBtn: 'Sembunyikan Spesifikasi & Arsitektur',
    aboutSpecTitle: 'Spesifikasi Teknis & Arsitektur',
    aboutCodecLabel: 'Format Audio Didukung',
    aboutMetadataLabel: 'Mesin Metadata Siaran',
    aboutDirectoryLabel: 'Direktori Radio Publik',
    aboutStorageLabel: 'Penyimpanan Data Lokal',
    aboutLicenseLabel: 'Lisensi Perangkat Lunak',
    aboutTechStackLabel: 'Teknologi Utama',
    aboutGithubLabel: 'Repositori GitHub',
    openLogsBtn: 'Buka Folder Log',
    copyDiagBtn: 'Salin Diagnostik',
    copiedDiagBtn: 'Diagnostik Tersalin',
    diagReportTitle: 'Laporan Diagnostik',

    // Modals
    modalAddTitle: 'Tambah Stasiun Radio',
    modalEditTitle: 'Informasi & Ubah Stasiun Radio',
    fieldName: 'Nama Stasiun',
    fieldUrl: 'URL Stream (HTTP/HTTPS atau Noice)',
    fieldLogo: 'URL Logo / Favicon (.png, .jpg, .ico)',
    fieldGenre: 'Genre',
    fieldCity: 'Kota',
    fieldGroup: 'Kategori / Grup',
    fieldTags: 'Tag (pisahkan dengan koma)',
    colType: 'Tipe',
    testStreamBtn: 'Uji Stream',
    testingStream: 'Menguji…',
    testOkPrefix: 'Stream aktif',
    testFailPrefix: 'Gagal terhubung',
    saveBtn: 'Simpan Perubahan',
    cancelBtn: 'Batal',
    duplicateStrategyLabel: 'Penanganan duplikat',
    dupSkip: 'Lewati (Skip)',
    dupOverwrite: 'Timpa (Overwrite)',
    dupDuplicate: 'Gandakan (Duplicate)',
    copyExportBtn: 'Salin Hasil Ekspor',
    copiedExportMsg: 'Hasil ekspor disalin ke clipboard.',
    importBtn: 'Impor Daftar',
    sleepCountdownTitle: 'Sleep Timer Aktif',
    sleepCountdownDesc: 'Siaran berhenti otomatis dalam {sec} detik',
    sleepCancelBtn: 'Batalkan Sleep',

    // Onboarding Intro Wizard
    introWelcomeTitle: 'Selamat Datang di Squelch',
    introWelcomeSubtitle:
        'Pemutar radio internet modern, super ringan, dan elegan langsung di menu bar macOS Anda.',
    introWelcomeFeature1Title: 'Ribuan Stasiun Radio Global & Lokal',
    introWelcomeFeature1Desc:
        'Akses ke lebih dari 30.000 stasiun radio dari Indonesia dan seluruh penjuru dunia secara instan.',
    introWelcomeFeature2Title: 'Minimalis & Menyatu dengan macOS',
    introWelcomeFeature2Desc:
        'Desain glassmorphism native yang rapi, hemat memori, dan selalu siap tanpa membebani layar Anda.',
    introWelcomeFeature3Title: 'Jadwal Acara & Statistik Aktivitas',
    introWelcomeFeature3Desc:
        'Pengingat siaran favorit otomatis dan pencatatan riwayat durasi mendengarkan yang lengkap.',

    introPermsTitle: 'Izin & Akses Sistem',
    introPermsSubtitle:
        'Atur preferensi integrasi sistem macOS agar pengalaman mendengarkan Anda maksimal.',
    introPermNotifyTitle: 'Notifikasi Lagu & Acara',
    introPermNotifyDesc:
        'Menampilkan judul lagu, nama artis saat berganti, serta pengingat jadwal siaran favorit Anda.',
    introPermNotifyBtn: 'Izinkan Notifikasi',
    introPermNotifyGranted: 'Notifikasi Aktif',
    introPermStorageTitle: 'Penyimpanan Data Lokal',
    introPermStorageDesc:
        'Menyimpan stasiun favorit, riwayat, dan preferensi Anda secara aman di Application Support lokal.',
    introPermStorageActive: 'Tersimpan Aman di Lokal',
    introPermAutostartTitle: 'Buka Otomatis Saat Login',
    introPermAutostartDesc:
        'Menjalankan Squelch di menu bar setiap kali komputer dinyalakan agar radio selalu siap sedia.',
    introPermAutoplayTitle: 'Putar Otomatis Stasiun Terakhir',
    introPermAutoplayDesc:
        'Melanjutkan pemutaran stasiun radio terakhir secara otomatis saat aplikasi dibuka.',

    introCustomTitle: 'Personalisasi & Tampilan',
    introCustomSubtitle:
        'Sesuaikan bahasa, tema warna, dan aksen yang sesuai dengan selera Anda.',
    introLanguageLabel: 'Pilihan Bahasa',
    introThemeLabel: 'Mode Tema Tampilan',
    introAccentLabel: 'Warna Aksen macOS',

    introReadyTitle: 'Semuanya Siap!',
    introReadySubtitle:
        'Squelch telah dikonfigurasi dan siap menemani hari Anda dengan alunan musik terbaik.',
    introReadyTip1:
        'Klik ikon radio di menu bar atas untuk memutar, menjeda, atau mengganti stasiun dengan cepat.',
    introReadyTip2:
        'Gunakan shortcut ⌘ + Shift + P kapan saja untuk putar/jeda siaran secara instan.',
    introReadyTip3:
        'Anda dapat mengubah pengaturan ini kapan saja melalui menu Pengaturan.',
    introStartBtn: 'Mulai Dengarkan Radio',
    introNextBtn: 'Lanjutkan',
    introBackBtn: 'Kembali',
    introSkipBtn: 'Lewati',
    introReopenBtn: 'Buka Panduan Awal (Intro)'
};
