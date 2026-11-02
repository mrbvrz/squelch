export type LocaleCode = 'id' | 'en';

export interface LocaleMetadata {
    code: LocaleCode;
    flag: string;
    nativeName: string;
    englishName: string;
}

export type Translations = TranslationDictionary;

export interface TranslationDictionary {
    // Navigation & Tabs
    tabStations: string;
    tabSchedules: string;
    tabDiscover: string;
    tabStats: string;
    tabPreferences: string;
    tabAbout: string;

    // Sidebar & Status
    searchPlaceholder: string;
    quitAppBtn: string;
    statusLiveSub: string;
    statusConnectingSub: string;
    statusBufferingSub: string;
    statusReconnectingSub: string;
    statusPausedSub: string;
    statusOfflineSub: string;
    statusStandbySub: string;

    // Tray Popover
    traySignalTitle: string;
    traySignalStreaming: string;
    traySignalReady: string;
    traySleepTitle: string;
    traySleepOff: string;
    trayNowPlaying: string;
    trayDefaultGroup: string;
    traySelectPrompt: string;
    trayClickStationHint: string;
    trayAllFilter: string;
    trayFavFilter: string;
    traySearchPlaceholder: string;
    trayAddStation: string;
    trayDiscover: string;
    traySettings: string;
    trayQuit: string;
    trayStatStations: string;
    trayStatFavorites: string;
    trayStatCategories: string;

    // Manage Stations Tab
    allStationsTitle: string;
    favoritesTitle: string;
    receiverIdleTitle: string;
    receiverPlayingPrefix: string;
    receiverConnectedDesc: string;
    receiverIdleDesc: string;
    allGroups: string;
    favoritesOnly: string;
    addGroupBtn: string;
    addGroupTitle: string;
    addGroupPlaceholder: string;
    saveGroupBtn: string;
    deleteGroupBtn: string;
    hideOffline: string;
    healthCheck: string;
    checkingHealth: string;
    removeOffline: string;
    importExport: string;
    addStation: string;
    emptyStationsText: string;
    emptyStationsTitle: string;
    emptyStationsDesc: string;
    emptyStationsDiscoverBtn: string;
    connectedBadge: string;
    play: string;
    stop: string;
    edit: string;
    delete: string;

    // Schedules & Reminders Tab
    schedulesTitle: string;
    schedulesSubtitle: string;
    addScheduleBtn: string;
    modalAddScheduleTitle: string;
    modalEditScheduleTitle: string;
    scheduleShowName: string;
    scheduleHost: string;
    scheduleStation: string;
    scheduleDays: string;
    scheduleTimeRange: string;
    scheduleStartTime: string;
    scheduleEndTime: string;
    scheduleAutoPlay: string;
    scheduleAutoPlayDesc: string;
    scheduleReminder: string;
    scheduleReminderAtStart: string;
    scheduleReminder5m: string;
    scheduleReminder10m: string;
    scheduleNotes: string;
    scheduleEmptyText: string;
    scheduleOnAirNow: string;
    scheduleDaysWeekdays: string;
    scheduleDaysAll: string;
    schedulePlayNow: string;

    // Discover Tab
    discoverTitle: string;
    discoverSubtitle: string;
    discoverSearchBtn: string;
    discoverLoadingBtn: string;
    discoverGlobalFilter: string;
    discoverName: string;
    discoverTag: string;
    discoverAvailableHeader: string;
    discoverPreviewBtn: string;
    discoverAddBtn: string;
    discoverAdded: string;
    discoverSearchCountryPlaceholder: string;
    discoverCountriesFound: string;
    discoverNoCountryMatch: string;

    // Listening Stats Tab (Harian, Mingguan, Bulanan, Tahunan)
    statsTitle: string;
    statsSubtitle: string;
    statsTodayLabel: string;
    statsWeekLabel: string;
    statsMonthLabel: string;
    statsYearLabel: string;
    statsChartTitle: string;
    statsDailyView: string;
    statsWeeklyView: string;
    statsMonthlyView: string;
    statsYearlyView: string;
    statsTopStationsTitle: string;
    statsEmptyText: string;

    // Preferences Tab
    prefSubtitle: string;
    prefAppearanceSection: string;
    prefThemeLabel: string;
    prefThemeSystem: string;
    prefThemeLight: string;
    prefThemeDark: string;
    prefAccentLabel: string;
    prefGlassOpacityLabel: string;
    prefGlassOpacityDesc: string;
    prefFontFamilyLabel: string;
    prefFontFamilyDesc: string;
    prefFontSystemDefault: string;
    prefFontSearchPlaceholder: string;
    prefFontFound: string;
    prefFontSelected: string;
    prefFontLoading: string;
    prefFontNoMatch: string;
    prefGeneral: string;
    prefLanguage: string;
    prefLaunchAtLogin: string;
    prefAutoPlay: string;
    prefNotifySong: string;
    prefConfirmQuit: string;
    prefAudioNet: string;
    prefAutoReconnect: string;
    prefMaxRetries: string;
    prefTimeout: string;
    prefBufferLabel: string;
    prefBufferDesc: string;
    prefBufferUltraLow: string;
    prefBufferBalanced: string;
    prefBufferCellular: string;
    prefBufferHigh: string;

    // Equalizer & Audio Enhancement
    prefEqSection: string;
    prefEqDesc: string;
    prefEqToggle: string;
    prefEqPresetLabel: string;
    prefEqResetBtn: string;
    prefEqNormalizationLabel: string;
    prefEqNormalizationDesc: string;
    prefEqCustomNotice: string;
    prefEqBadgeActive: string;
    prefEqWaveVisualizer: string;
    prefEqWaveInteractiveHint: string;
    prefEqResetBandTooltip: string;
    prefShortcuts: string;
    prefShortcutRecordHint: string;
    prefShortcutRecording: string;
    prefShortcutPlayPause: string;
    prefShortcutNext: string;
    prefShortcutPrev: string;
    prefShortcutUnassigned: string;
    prefShortcutClear: string;
    prefShortcutReset: string;
    prefShortcutConflict: string;
    prefBackupSection: string;
    prefBackupTitle: string;
    prefBackupDesc: string;
    prefBackupBtn: string;
    prefRestoreBtn: string;
    prefBackupSuccess: string;
    prefRestoreSuccess: string;
    prefNotifSection: string;
    prefNotifDesc: string;
    prefNotifStatusGranted: string;
    prefNotifStatusPrompt: string;
    prefNotifTestBtn: string;
    prefNotifTestSuccess: string;
    sleepNotifTitle: string;
    sleepNotif1Min: string;
    sleepNotifDone: string;
    prefDiagSection: string;
    prefDiagDesc: string;
    prefDiagShowBtn: string;
    prefDiagHideBtn: string;
    prefDataDirLabel: string;
    prefDangerSection: string;
    prefResetDesc: string;
    prefResetBtn: string;
    prefResetConfirmTitle: string;
    prefResetConfirmDesc: string;
    prefResetConfirmYes: string;

    prefClearStationsTitle: string;
    prefClearStationsDesc: string;
    prefClearStationsBtn: string;
    prefClearStationsConfirmTitle: string;
    prefClearStationsConfirmDesc: string;

    prefClearSchedulesTitle: string;
    prefClearSchedulesDesc: string;
    prefClearSchedulesBtn: string;
    prefClearSchedulesConfirmTitle: string;
    prefClearSchedulesConfirmDesc: string;

    prefClearStatsTitle: string;
    prefClearStatsDesc: string;
    prefClearStatsBtn: string;
    prefClearStatsConfirmTitle: string;
    prefClearStatsConfirmDesc: string;

    prefResetAllTitle: string;
    prefResetAllDesc: string;
    prefResetAllBtn: string;
    prefResetAllConfirmTitle: string;
    prefResetAllConfirmDesc: string;

    // About & Diagnostics
    aboutTagline: string;
    aboutDescription: string;
    aboutWebsiteBtn: string;
    aboutSpecLink: string;
    aboutChangelogLink: string;
    aboutShowSpecsBtn: string;
    aboutHideSpecsBtn: string;
    aboutSpecTitle: string;
    aboutCodecLabel: string;
    aboutMetadataLabel: string;
    aboutDirectoryLabel: string;
    aboutStorageLabel: string;
    aboutLicenseLabel: string;
    aboutTechStackLabel: string;
    aboutGithubLabel: string;
    openLogsBtn: string;
    copyDiagBtn: string;
    copiedDiagBtn: string;
    diagReportTitle: string;

    // Modals (Add/Edit & Import/Export)
    modalAddTitle: string;
    modalEditTitle: string;
    fieldName: string;
    fieldUrl: string;
    fieldLogo: string;
    fieldGenre: string;
    fieldCity: string;
    fieldGroup: string;
    fieldTags: string;
    colType: string;
    testStreamBtn: string;
    testingStream: string;
    testOkPrefix: string;
    testFailPrefix: string;
    saveBtn: string;
    cancelBtn: string;
    duplicateStrategyLabel: string;
    dupSkip: string;
    dupOverwrite: string;
    dupDuplicate: string;
    copyExportBtn: string;
    copiedExportMsg: string;
    importBtn: string;
    sleepCountdownTitle: string;
    sleepCountdownDesc: string;
    sleepCancelBtn: string;

    // Onboarding Intro Wizard
    introWelcomeTitle: string;
    introWelcomeSubtitle: string;
    introWelcomeFeature1Title: string;
    introWelcomeFeature1Desc: string;
    introWelcomeFeature2Title: string;
    introWelcomeFeature2Desc: string;
    introWelcomeFeature3Title: string;
    introWelcomeFeature3Desc: string;
    introPermsTitle: string;
    introPermsSubtitle: string;
    introPermNotifyTitle: string;
    introPermNotifyDesc: string;
    introPermNotifyBtn: string;
    introPermNotifyGranted: string;
    introPermStorageTitle: string;
    introPermStorageDesc: string;
    introPermStorageActive: string;
    introPermAutostartTitle: string;
    introPermAutostartDesc: string;
    introPermAutoplayTitle: string;
    introPermAutoplayDesc: string;
    introCustomTitle: string;
    introCustomSubtitle: string;
    introLanguageLabel: string;
    introThemeLabel: string;
    introAccentLabel: string;
    introReadyTitle: string;
    introReadySubtitle: string;
    introReadyTip1: string;
    introReadyTip2: string;
    introReadyTip3: string;
    introStartBtn: string;
    introNextBtn: string;
    introBackBtn: string;
    introSkipBtn: string;
    introReopenBtn: string;

    // App Updates
    updatesSectionTitle: string;
    updatesSectionDesc: string;
    updatesCurrentVersion: string;
    updatesCheckBtn: string;
    updatesChecking: string;
    updatesCheckingTitle: string;
    updatesCheckingDesc: string;
    updatesUpToDate: string;
    updatesUpToDateDesc: string;
    updatesAvailable: string;
    updatesAutoCheck: string;
    updatesModalTitle: string;
    updatesModalSubtitle: string;
    updatesDownloadDmg: string;
    updatesViewNotes: string;
    updatesDismiss: string;
    updatesChangelogLabel: string;
    updatesError: string;
    updatesRetryBtn: string;
    updatesDoneBtn: string;

    // System Notifications
    notifConnectionLostTitle: string;
    notifReconnectFailedBody: string;
    notifTimeoutStoppedBody: string;
}
