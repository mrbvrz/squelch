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
    addGroupBtn: 'Kategori',
    addGroupTitle: 'Tambah Kategori Siaran',
    addGroupPlaceholder: 'Nama kategori baru…',
    saveGroupBtn: 'Simpan',
    deleteGroupBtn: 'Hapus kategori',
    hideOffline: 'Sembunyikan Offline',
    showOffline: 'Tampilkan Offline',
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
    discoverSearchCountryPlaceholder: 'Cari negara…',
    discoverCountriesFound: 'negara ditemukan',
    discoverNoCountryMatch: 'Tidak ada negara yang cocok',
    discoverFilterBitrate: 'Filter Kualitas',
    discoverAllBitrates: 'Semua Bitrate',
    discoverSortDefault: 'Urutan Bawaan',
    discoverSortBitrate: 'Bitrate Tertinggi',
    discoverSortName: 'Nama (A-Z)',
    discoverLoadingHeader: 'Mencari Stasiun Radio...',
    discoverLoadingSub:
        'Menghubungkan ke direktori online publik Radio-Browser...',
    discoverNoResultsTitle: 'Tidak ada stasiun radio yang ditemukan',
    discoverNoResultsHint:
        'Coba ubah filter negara, kata kunci pencarian, atau sesuaikan filter bitrate.',

    // Listening Stats Tab (Harian, Mingguan, Bulanan, Tahunan)
    statsTitle: 'Aktivitas Mendengarkan',
    statsSubtitle:
        'Catatan durasi mendengarkan radio harian, mingguan, bulanan, tahunan, dan stasiun terpopuler Anda.',
    statsTodayLabel: 'Hari Ini',
    statsWeekLabel: 'Minggu Ini',
    statsMonthLabel: 'Bulan Ini',
    statsYearLabel: 'Tahun Ini',
    statsChartTitle: 'Grafik Durasi Mendengarkan',
    statsDailyView: 'Harian',
    statsWeeklyView: 'Mingguan',
    statsMonthlyView: 'Bulanan',
    statsYearlyView: 'Tahunan',
    statsTopStationsTitle: 'Stasiun Paling Sering Didengar',
    statsEmptyTitle: 'Belum Ada Riwayat Mendengar',
    statsEmptyText:
        'Belum ada riwayat durasi mendengarkan. Putar stasiun radio untuk mulai mencatat statistik.',
    statsEmptyActionBtn: 'Putar Radio Sekarang',

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
    prefGlassOpacityDesc: 'Tingkat opasitas jendela dan menu tray',
    prefFontFamilyLabel: 'Jenis Huruf (Font)',
    prefFontFamilyDesc: 'Gunakan font sistem bawaan atau pilih font terinstal',
    prefFontSystemDefault: 'Font Sistem Bawaan',
    prefFontSearchPlaceholder: 'Cari font sistem...',
    prefFontFound: 'font ditemukan',
    prefFontSelected: 'Terpilih',
    prefFontLoading: 'Memuat font sistem...',
    prefFontNoMatch: 'Tidak ada font yang cocok',
    prefGeneral: 'Umum & Perilaku',
    prefLanguage: 'Bahasa Antarmuka',
    prefLaunchAtLogin: 'Jalankan saat login sistem',
    prefHideFromDock: 'Sembunyikan ikon dari macOS Dock (Mode Menu Bar Saja)',
    prefHideFromDockDesc:
        'Jalankan Squelch secara minimalis di bilah menu atas tanpa memakan ruang pada Dock aplikasi.',
    prefAutoPlay: 'Putar otomatis stasiun terakhir saat dibuka',
    prefNotifySong: 'Notifikasi sistem saat judul lagu berganti',
    prefConfirmQuit: 'Tampilkan konfirmasi sebelum keluar aplikasi',
    prefAudioNet: 'Audio & Jaringan',
    prefAutoReconnect: 'Sambung ulang otomatis saat jaringan terputus',
    prefMaxRetries: 'Batas percobaan rekoneksi',
    prefTimeout: 'Batas waktu jaringan (Timeout)',
    prefBufferLabel: 'Durasi Buffer Streaming',
    prefBufferDesc:
        'Buffer lebih panjang mencegah audio tersendat pada tethering atau jaringan seluler yang tidak stabil.',
    prefBufferUltraLow: '3 detik (Latensi Ultra-rendah)',
    prefBufferBalanced: '5 detik (Seimbang & Rekomendasi)',
    prefBufferCellular: '10 detik (Stabil Seluler / Tethering)',
    prefBufferHigh: '15 detik (Anti-stutter Sinyal Lemah)',
    prefAudioOutputDevice: 'Perangkat Output Audio',
    prefAudioOutputDeviceDesc:
        'Pilih rute audio radio ke speaker laptop, headphone Bluetooth, AirPods, atau DAC terpisah.',
    prefAudioOutputDefault: 'Bawaan Sistem (macOS Default)',
    prefAudioOutputLoading: 'Mendeteksi perangkat audio...',

    // Equalizer & Audio Enhancement
    prefEqSection: 'Equalizer & Karakter Suara',
    prefEqDesc:
        'Sesuaikan respon frekuensi 8-band dengan visualizer kurva gelombang dinamis dan kompresor untuk kejernihan audio maksimal.',
    prefEqToggle: 'Aktifkan Audio Equalizer',
    prefEqPresetLabel: 'Preset Karakter Suara',
    prefEqResetBtn: 'Kembalikan EQ Datar',
    prefEqNormalizationLabel: 'Penstabil Volume & Anti-Kliping',
    prefEqNormalizationDesc:
        'Membatasi lonjakan audio keras dan mencegah distorsi kliping digital saat menaikkan level frekuensi EQ.',
    prefEqCustomNotice: 'Kustom (Disetel Manual)',
    prefEqBadgeActive: 'EQ Aktif',
    prefEqWaveVisualizer: 'Wave Equalizer (Kurva Respon Frekuensi)',
    prefEqWaveInteractiveHint:
        'Geser titik kurva atau slider untuk mengatur respon nada',
    prefEqResetBandTooltip: 'Klik ganda untuk reset band ke 0 dB',
    prefShortcuts: 'Pintasan Keyboard Global',
    prefShortcutRecordHint:
        'Kendalikan siaran radio langsung dari aplikasi mana pun di macOS',
    prefShortcutRecording: 'Tekan tombol…',
    prefShortcutPlayPause: 'Putar / Jeda Siaran',
    prefShortcutNext: 'Stasiun Berikutnya',
    prefShortcutPrev: 'Stasiun Sebelumnya',
    prefShortcutUnassigned: 'Klik untuk atur pintasan',
    prefShortcutClear: 'Hapus Pintasan',
    prefShortcutReset: 'Kembalikan Default',
    prefShortcutConflict: 'Pintasan ini bertabrakan dengan aksi lain',
    prefBackupSection: 'Cadangkan & Pulihkan Data',
    prefBackupTitle: 'Cadangan Stasiun & Pengaturan',
    prefBackupDesc:
        'Ekspor seluruh stasiun, kategori, preferensi, dan riwayat dengar ke file JSON atau pulihkan dari cadangan.',
    prefBackupBtn: 'Buat Cadangan…',
    prefRestoreBtn: 'Pulihkan Cadangan…',
    prefBackupSuccess: 'Cadangan berhasil disimpan.',
    prefRestoreSuccess: 'Data cadangan berhasil dipulihkan.',
    prefNotifSection: 'Notifikasi Sistem',
    prefNotifDesc:
        'Pemberitahuan sistem native macOS saat waktu tidur akan berakhir, jadwal rekaman aktif, dan pembaruan pemutar.',
    prefNotifStatusGranted: 'Notifikasi Aktif',
    prefNotifStatusPrompt: 'Perlu Izin Sistem',
    prefNotifTestBtn: 'Uji Notifikasi Sistem',
    prefNotifTestSuccess: 'Notifikasi terkirim!',
    sleepNotifTitle: 'Pengatur Waktu Tidur',
    sleepNotif1Min: 'Siaran radio akan dinonaktifkan dalam 1 menit.',
    sleepNotifDone:
        'Pemutaran radio telah dihentikan oleh pengatur waktu tidur.',
    prefDiagSection: 'Diagnostik & Log Sistem',
    prefDiagDesc:
        'Informasi direktori penyimpanan lokal dan catatan log operasional aplikasi.',
    prefDiagShowBtn: 'Tampilkan Laporan Diagnostik',
    prefDiagHideBtn: 'Sembunyikan Laporan Diagnostik',
    prefDataDirLabel: 'Direktori data',
    prefDangerSection: 'Pengelolaan Data & Reset',
    prefResetDesc:
        'Kembalikan seluruh data dan pengaturan aplikasi ke setelan bawaan pabrik, termasuk stasiun radio, jadwal siaran, dan statistik mendengarkan.',
    prefResetBtn: 'Kembalikan Bawaan',
    prefResetConfirmTitle: 'Kembalikan ke Setelan Bawaan?',
    prefResetConfirmDesc:
        'Semua stasiun radio, riwayat statistik mendengarkan, jadwal siaran, serta kustomisasi tema, warna aksen, font, dan pintasan keyboard akan direset ke kondisi awal.',
    prefResetConfirmYes: 'Ya, Kembalikan Bawaan',

    prefClearStationsTitle: 'Hapus Semua Stasiun Radio',
    prefClearStationsDesc:
        'Hapus seluruh daftar stasiun radio dan kategori yang tersimpan dalam koleksi Anda.',
    prefClearStationsBtn: 'Hapus Stasiun',
    prefClearStationsConfirmTitle: 'Hapus Semua Stasiun Radio?',
    prefClearStationsConfirmDesc:
        'Tindakan ini akan mengosongkan seluruh stasiun radio dan kategori Anda. Data yang dihapus tidak dapat dipulihkan kecuali Anda memiliki cadangan.',

    prefClearSchedulesTitle: 'Hapus Semua Jadwal Siaran',
    prefClearSchedulesDesc:
        'Hapus semua jadwal siaran radio dan pengingat yang telah Anda jadwalkan.',
    prefClearSchedulesBtn: 'Hapus Jadwal',
    prefClearSchedulesConfirmTitle: 'Hapus Semua Jadwal Siaran?',
    prefClearSchedulesConfirmDesc:
        'Seluruh jadwal siaran radio dan pengingat otomatis akan dihapus permanen.',

    prefClearStatsTitle: 'Hapus Riwayat Statistik',
    prefClearStatsDesc:
        'Setel ulang seluruh riwayat durasi mendengarkan harian, mingguan, bulanan, dan stasiun terpopuler.',
    prefClearStatsBtn: 'Hapus Statistik',
    prefClearStatsConfirmTitle: 'Hapus Riwayat Statistik Mendengarkan?',
    prefClearStatsConfirmDesc:
        'Semua catatan waktu mendengarkan radio akan direset ke angka 0. Tindakan ini tidak dapat dibatalkan.',

    prefClearDropdownLabel: 'Hapus Data',
    prefClearAllDataOption: 'Semua Data',
    prefClearBtn: 'Hapus Data',

    prefResetAllTitle: 'Semua Data',
    prefResetAllDesc:
        'Hapus seluruh stasiun radio, jadwal siaran, dan riwayat statistik mendengarkan sekaligus tanpa mengubah setelan preferensi aplikasi.',
    prefResetAllBtn: 'Hapus Semua Data',
    prefResetAllConfirmTitle: 'Hapus Semua Data?',
    prefResetAllConfirmDesc:
        'Seluruh stasiun radio, jadwal siaran, dan riwayat statistik mendengarkan akan dihapus permanen. Setelan preferensi aplikasi Anda akan tetap aman tersimpan.',

    // About & Diagnostics
    aboutTagline: 'Pemutar Radio Internet Menu Bar Modern & Ringan',
    aboutDescription:
        'Dirancang untuk mendengarkan siaran radio langsung dari menu bar tanpa membebani sistem. Mendukung aliran MP3, AAC/HE-AAC, OGG/Opus, dan HLS (.m3u8) dengan ekstraksi ICY metadata lokal, statistik durasi dengar, serta integrasi direktori publik.',
    aboutWebsiteBtn: 'Website',
    aboutSpecLink: 'Spesifikasi',
    aboutChangelogLink: 'Changelog',
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
    typeAutoLocked: 'Otomatis',
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
    introReopenBtn: 'Buka Panduan Awal (Intro)',

    // App Updates
    updatesSectionTitle: 'Pembaruan Aplikasi',
    updatesSectionDesc:
        'Periksa versi terbaru Squelch dan unduh rilis terbaru langsung dari GitHub.',
    updatesCurrentVersion: 'Versi Terpasang',
    updatesCheckBtn: 'Periksa Pembaruan',
    updatesChecking: 'Memeriksa GitHub…',
    updatesCheckingTitle: 'Memeriksa Pembaruan...',
    updatesCheckingDesc:
        'Menghubungi server GitHub untuk mengecek versi terbaru Squelch.',
    updatesUpToDate: 'Squelch sudah versi terbaru',
    updatesUpToDateDesc:
        'Anda telah menggunakan versi terbaru Squelch. Tidak ada tindakan yang diperlukan.',
    updatesAvailable: 'Pembaruan Tersedia',
    updatesAutoCheck: 'Periksa pembaruan otomatis saat aplikasi dibuka',
    updatesModalTitle: 'Pembaruan Baru Tersedia: {ver}',
    updatesModalSubtitle:
        'Versi baru Squelch siap diunduh dengan peningkatan performa dan fitur terbaru.',
    updatesDownloadDmg: 'Unduh Pembaruan (.dmg)',
    updatesDownloadBackground: 'Unduh di Latar Belakang',
    updatesDownloading: 'Mengunduh di latar belakang…',
    updatesDownloadDesc: 'Mengunduh installer versi terbaru di latar belakang.',
    updatesBackgroundNote:
        'Anda dapat menutup jendela ini. Pemutaran radio akan tetap berjalan normal.',
    updatesCancelDownload: 'Batalkan Unduhan',
    updatesKeepInBackground: 'Lanjutkan di Latar Belakang',
    updatesReadyTitle: 'Pembaruan Siap Dipasang',
    updatesReadySubtitle:
        'Installer pembaruan telah selesai diunduh di latar belakang. Buka installer untuk memperbarui aplikasi.',
    updatesInstallBtn: 'Buka Installer & Pasang',
    updatesRevealFinderBtn: 'Tampilkan di Finder',
    updatesDownloadError: 'Gagal mengunduh berkas pembaruan.',
    updatesRetryDownload: 'Coba Unduh Lagi',
    updatesFallbackBrowser: 'Unduh Manual via Browser',
    updatesDownloadedBadge: 'Pembaruan Siap Dipasang',
    updatesDownloadingBadge: 'Mengunduh Pembaruan',
    updatesViewNotes: 'Lihat Catatan Rilis di GitHub',
    updatesDismiss: 'Nanti Saja',
    updatesChangelogLabel: 'Catatan Perubahan (Changelog)',
    updatesError: 'Gagal memeriksa pembaruan',
    updatesRetryBtn: 'Coba Lagi',
    updatesDoneBtn: 'Selesai',

    // System Notifications
    notifConnectionLostTitle: 'Koneksi Terputus',
    notifReconnectFailedBody:
        'Gagal menyambung ulang ke {station} setelah {attempts} percobaan. Pemutaran dihentikan.',
    notifTimeoutStoppedBody:
        'Gagal memuat {station} karena kendala jaringan. Pemutaran dihentikan.'
};
