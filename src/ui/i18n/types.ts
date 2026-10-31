export type LocaleCode = 'id' | 'en';

export interface LocaleMetadata {
    code: LocaleCode;
    flag: string;
    nativeName: string;
    englishName: string;
}

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

    // Listening Stats Tab (Mingguan, Bulanan, Tahunan)
    statsTitle: string;
    statsSubtitle: string;
    statsWeekLabel: string;
    statsMonthLabel: string;
    statsYearLabel: string;
    statsChartTitle: string;
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
    prefShortcuts: string;
    prefShortcutRecordHint: string;
    prefShortcutRecording: string;
    prefShortcutPlayPause: string;
    prefShortcutNext: string;
    prefShortcutPrev: string;
    prefBackupSection: string;
    prefBackupTitle: string;
    prefBackupDesc: string;
    prefBackupBtn: string;
    prefRestoreBtn: string;
    prefBackupSuccess: string;
    prefRestoreSuccess: string;
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
}
