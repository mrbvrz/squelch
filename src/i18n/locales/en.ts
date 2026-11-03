import { TranslationDictionary } from '../types';

export const enLocale: TranslationDictionary = {
    // Navigation & Tabs
    tabStations: 'Radio Stations',
    tabSchedules: 'Show Schedules',
    tabDiscover: 'Online Directory',
    tabStats: 'Listening Activity',
    tabPreferences: 'Preferences',
    tabAbout: 'About',

    // Sidebar & Status
    searchPlaceholder: 'Search station, genre, city…',
    quitAppBtn: 'Quit Squelch',
    statusLiveSub: 'On Air',
    statusConnectingSub: 'Connecting',
    statusBufferingSub: 'Buffering',
    statusReconnectingSub: 'Reconnecting',
    statusPausedSub: 'Paused',
    statusOfflineSub: 'Offline',
    statusStandbySub: 'Standby',

    // Tray Popover
    traySignalTitle: 'SIGNAL',
    traySignalStreaming: 'Streaming',
    traySignalReady: 'Standby',
    traySleepTitle: 'SLEEP',
    traySleepOff: 'Off',
    trayNowPlaying: 'Now Playing',
    trayDefaultGroup: 'Radio Broadcast',
    traySelectPrompt: 'Select a Radio Station',
    trayClickStationHint: 'Click any station below to start listening',
    trayAllFilter: 'All',
    trayFavFilter: 'Favorites',
    traySearchPlaceholder: 'Search stations (Jak, Gen, RRI, Elshinta)…',
    trayAddStation: 'Add Station',
    trayDiscover: 'Discover',
    traySettings: 'Settings',
    trayQuit: 'Quit',
    trayStatStations: 'Stations',
    trayStatFavorites: 'Favorites',
    trayStatCategories: 'Categories',

    // Manage Stations Tab
    allStationsTitle: 'All Stations',
    favoritesTitle: 'Favorites',
    receiverIdleTitle: 'Squelch Receiver',
    receiverPlayingPrefix: 'Playing:',
    receiverConnectedDesc:
        'Connected to live broadcast. Use the toggle on the right to pause or resume playback.',
    receiverIdleDesc:
        'Select a station below to stream live audio directly from the menu bar.',
    allGroups: 'All',
    favoritesOnly: 'Favorites',
    addGroupBtn: 'Category',
    addGroupTitle: 'Add Broadcast Category',
    addGroupPlaceholder: 'New category name…',
    saveGroupBtn: 'Save',
    deleteGroupBtn: 'Delete category',
    hideOffline: 'Hide Offline',
    showOffline: 'Show Offline',
    healthCheck: 'Verify Streams',
    checkingHealth: 'Verifying…',
    healthCheckComplete: 'Verification Complete',
    healthCheckingStation: 'Checking station',
    removeOffline: 'Remove Offline',
    importExport: 'Import / Export',
    addStation: 'Add Station',
    emptyStationsText: 'No stations match the current filter.',
    emptyStationsTitle: 'No Radio Stations Yet',
    emptyStationsDesc:
        'Add your favorite radio streaming station or discover thousands of free broadcasts from the online directory.',
    emptyStationsDiscoverBtn: 'Browse Online Directory',
    connectedBadge: 'Connected',
    play: 'Play',
    stop: 'Stop',
    edit: 'Edit',
    delete: 'Delete',

    // Schedules & Reminders Tab
    schedulesTitle: 'Show Schedules & Reminders',
    schedulesSubtitle:
        'Save schedules for your favorite radio broadcasts with native alerts and optional automatic playback when the show begins.',
    addScheduleBtn: 'Add Show Schedule',
    modalAddScheduleTitle: 'Add Radio Show Schedule',
    modalEditScheduleTitle: 'Edit Radio Show Schedule',
    scheduleShowName: 'Broadcast / Show Name',
    scheduleHost: 'Host / Presenter Name',
    scheduleStation: 'Radio Station',
    scheduleDays: 'Days of Week',
    scheduleTimeRange: 'Broadcast Time Window',
    scheduleStartTime: 'Start Time',
    scheduleEndTime: 'End Time',
    scheduleAutoPlay: 'Autoplay Broadcast',
    scheduleAutoPlayDesc:
        'Automatically tune in and play this station when the broadcast starts',
    scheduleReminder: 'Reminder Alert',
    scheduleReminderAtStart: 'Right when the show starts',
    scheduleReminder5m: '5 Minutes before start',
    scheduleReminder10m: '10 Minutes before start',
    scheduleNotes: 'Notes / Show Description',
    scheduleEmptyText: 'No scheduled radio broadcasts configured yet.',
    scheduleOnAirNow: 'On Air Now',
    scheduleDaysWeekdays: 'Mon - Fri',
    scheduleDaysAll: 'Every Day',
    schedulePlayNow: 'Play Now',

    // Discover Tab
    discoverTitle: 'Public Radio Directory',
    discoverSubtitle:
        'Search and add public internet radio streams from the radio-browser.info open directory.',
    discoverSearchBtn: 'Search',
    discoverLoadingBtn: 'Searching…',
    discoverGlobalFilter: 'Global (All Countries)',
    discoverName: 'Station name…',
    discoverTag: 'Genre / tag…',
    discoverAvailableHeader: 'Available Stations',
    discoverPreviewBtn: 'Preview',
    discoverAddBtn: '+ Add',
    discoverAdded: 'Saved',
    discoverSearchCountryPlaceholder: 'Search country…',
    discoverCountriesFound: 'countries found',
    discoverNoCountryMatch: 'No matching country',
    discoverFilterBitrate: 'Quality Filter',
    discoverAllBitrates: 'All Bitrates',
    discoverSortDefault: 'Default Order',
    discoverSortBitrate: 'Highest Bitrate',
    discoverSortName: 'Name (A-Z)',
    discoverLoadingHeader: 'Searching Radio Stations...',
    discoverLoadingSub: 'Querying public Radio-Browser online directory...',
    discoverNoResultsTitle: 'No radio stations found',
    discoverNoResultsHint:
        'Try changing the country filter, search query, or adjusting the bitrate filter.',

    // Listening Stats Tab (Daily, Weekly, Monthly, Yearly)
    statsTitle: 'Listening Activity',
    statsSubtitle:
        'Daily, weekly, monthly, and yearly listening duration history along with your most played stations.',
    statsTodayLabel: 'Today',
    statsWeekLabel: 'This Week',
    statsMonthLabel: 'This Month',
    statsYearLabel: 'This Year',
    statsChartTitle: 'Listening Duration Graph',
    statsDailyView: 'Daily',
    statsWeeklyView: 'Weekly',
    statsMonthlyView: 'Monthly',
    statsYearlyView: 'Yearly',
    statsTopStationsTitle: 'Most Listened Stations',
    statsEmptyTitle: 'No Listening History Yet',
    statsEmptyText:
        'No listening duration recorded yet. Play any station to start tracking statistics.',
    statsEmptyActionBtn: 'Listen Now',

    // Preferences Tab
    prefSubtitle:
        'Customize visual theme, accent color, typography, network reconnection, data backup, and global shortcuts.',
    prefAppearanceSection: 'Appearance & Personalization',
    prefThemeLabel: 'Window Theme',
    prefThemeSystem: 'System',
    prefThemeLight: 'Light',
    prefThemeDark: 'Dark',
    prefAccentLabel: 'Accent Color',
    prefGlassOpacityLabel: 'Glass Surface Opacity',
    prefGlassOpacityDesc: 'Window and tray popover opacity level',
    prefFontFamilyLabel: 'Typography (System Font)',
    prefFontFamilyDesc:
        'Use default OS system font or pick any installed font family',
    prefFontSystemDefault: 'System Default',
    prefFontSearchPlaceholder: 'Search system fonts...',
    prefFontFound: 'fonts found',
    prefFontSelected: 'Selected',
    prefFontLoading: 'Loading system fonts...',
    prefFontNoMatch: 'No matching fonts found',
    prefGeneral: 'General & Behavior',
    prefLanguage: 'Interface Language',
    prefLaunchAtLogin: 'Launch at system login',
    prefHideFromDock: 'Hide app from macOS Dock (Menu Bar Only Mode)',
    prefHideFromDockDesc:
        'Run Squelch as a clean background menu bar utility without taking space in the macOS Dock.',
    prefAutoPlay: 'Auto-play last station on launch',
    prefNotifySong: 'Show notification when song title changes',
    prefConfirmQuit: 'Ask for confirmation before quitting app',
    prefAudioNet: 'Audio & Network',
    prefAutoReconnect: 'Auto-reconnect when network stream drops',
    prefMaxRetries: 'Max reconnect attempts',
    prefTimeout: 'Network timeout',
    prefBufferLabel: 'Streaming Buffer Length',
    prefBufferDesc:
        'A longer buffer avoids audio stuttering on tethering or unstable cellular network connections.',
    prefBufferUltraLow: '3 sec (Ultra-low latency)',
    prefBufferBalanced: '5 sec (Balanced & Recommended)',
    prefBufferCellular: '10 sec (Stable Cellular / Tethering)',
    prefBufferHigh: '15 sec (Anti-stutter Weak Signal)',
    prefAudioOutputDevice: 'Audio Output Device',
    prefAudioOutputDeviceDesc:
        'Route radio audio to laptop speakers, Bluetooth headphones, AirPods, or a dedicated DAC.',
    prefAudioOutputDefault: 'System Default (macOS)',
    prefAudioOutputLoading: 'Detecting audio devices...',

    // Equalizer & Audio Enhancement
    prefEqSection: 'Equalizer & Sound Quality',
    prefEqDesc:
        'Tailor the 8-band frequency response with real-time wave curve visualizer and dynamic limiting for optimal broadcast clarity.',
    prefEqToggle: 'Enable Audio Equalizer',
    prefEqPresetLabel: 'Audio Equalizer Preset',
    prefEqResetBtn: 'Reset EQ to Flat',
    prefEqNormalizationLabel: 'Volume Normalization & Anti-Clipping',
    prefEqNormalizationDesc:
        'Tames loud bursts and prevents digital clipping distortion when boosting equalizer frequencies.',
    prefEqCustomNotice: 'Custom (User Adjusted)',
    prefEqBadgeActive: 'EQ Active',
    prefEqWaveVisualizer: 'Wave Equalizer (Frequency Response Curve)',
    prefEqWaveInteractiveHint:
        'Drag curve nodes or sliders to shape tone response',
    prefEqResetBandTooltip: 'Double-click to reset band to 0 dB',
    prefShortcuts: 'Global Keyboard Shortcuts',
    prefShortcutRecordHint:
        'Press keys from anywhere in macOS to control radio playback instantly',
    prefShortcutRecording: 'Press keys…',
    prefShortcutPlayPause: 'Play / Pause Stream',
    prefShortcutNext: 'Next Station',
    prefShortcutPrev: 'Previous Station',
    prefShortcutUnassigned: 'Click to assign shortcut',
    prefShortcutClear: 'Clear Shortcut',
    prefShortcutReset: 'Reset to Default',
    prefShortcutConflict: 'This shortcut conflicts with another action',
    prefBackupSection: 'Backup & Restore Data',
    prefBackupTitle: 'Stations & Settings Backup',
    prefBackupDesc:
        'Export all stations, categories, preferences, and listening history to a JSON file or restore from a backup.',
    prefBackupBtn: 'Create Backup…',
    prefRestoreBtn: 'Restore Backup…',
    prefBackupSuccess: 'Backup saved successfully.',
    prefRestoreSuccess: 'Backup data restored successfully.',
    prefNotifSection: 'System Notifications',
    prefNotifDesc:
        'Native macOS system notifications when sleep timer is ending, station schedules trigger, and player updates.',
    prefNotifStatusGranted: 'Notifications Active',
    prefNotifStatusPrompt: 'Requires System Permission',
    prefNotifTestBtn: 'Test System Notification',
    prefNotifTestSuccess: 'Notification sent!',
    sleepNotifTitle: 'Sleep Timer',
    sleepNotif1Min: 'Radio playback will turn off in 1 minute.',
    sleepNotifDone: 'Radio playback stopped by sleep timer.',
    prefDiagSection: 'Diagnostics & System Logs',
    prefDiagDesc:
        'Local storage directory information and application operational logs.',
    prefDiagShowBtn: 'Show Diagnostic Report',
    prefDiagHideBtn: 'Hide Diagnostic Report',
    prefDataDirLabel: 'Data directory',
    prefDangerSection: 'Data Management & Reset',
    prefResetDesc:
        'Reset the entire application to factory defaults, including all radio stations, schedules, listening statistics, and preferences.',
    prefResetBtn: 'Reset Defaults',
    prefResetConfirmTitle: 'Reset to Factory Defaults?',
    prefResetConfirmDesc:
        'All radio stations, broadcast schedules, listening statistics, themes, accent colors, fonts, and keyboard shortcuts will be reset to factory defaults.',
    prefResetConfirmYes: 'Yes, Reset Defaults',

    prefClearStationsTitle: 'Delete All Radio Stations',
    prefClearStationsDesc:
        'Delete all saved radio stations and categories from your personal collection.',
    prefClearStationsBtn: 'Delete Stations',
    prefClearStationsConfirmTitle: 'Delete All Radio Stations?',
    prefClearStationsConfirmDesc:
        'This action will clear all your radio stations and categories. Deleted data cannot be recovered unless you have a backup file.',

    prefClearSchedulesTitle: 'Delete All Show Schedules',
    prefClearSchedulesDesc:
        'Delete all scheduled radio shows, reminders, and auto-play events.',
    prefClearSchedulesBtn: 'Delete Schedules',
    prefClearSchedulesConfirmTitle: 'Delete All Show Schedules?',
    prefClearSchedulesConfirmDesc:
        'All broadcast schedules and automated reminders will be permanently deleted.',

    prefClearStatsTitle: 'Clear Listening Statistics',
    prefClearStatsDesc:
        'Reset all daily, weekly, monthly, and yearly listening history and top stations.',
    prefClearStatsBtn: 'Clear Statistics',
    prefClearStatsConfirmTitle: 'Clear Listening History & Statistics?',
    prefClearStatsConfirmDesc:
        'All listening duration logs will be reset to 0. This action cannot be undone.',

    prefClearDropdownLabel: 'Delete Data',
    prefClearAllDataOption: 'All Data',
    prefClearBtn: 'Delete Data',

    prefResetAllTitle: 'All Data',
    prefResetAllDesc:
        'Delete all radio stations, show schedules, and listening statistics simultaneously without resetting app preferences.',
    prefResetAllBtn: 'Delete All Data',
    prefResetAllConfirmTitle: 'Delete All Data?',
    prefResetAllConfirmDesc:
        'All radio stations, broadcast schedules, and listening history will be permanently deleted. Your app preferences will remain saved.',

    // About & Diagnostics
    aboutTagline: 'Modern & Lightweight Menu Bar Internet Radio Receiver',
    aboutDescription:
        'Designed for effortless live radio listening from the system menu bar with near-zero resource overhead. Supports MP3, AAC/HE-AAC, OGG/Opus, and HLS (.m3u8) streams with local ICY metadata extraction, listening analytics, and public directory discovery.',
    aboutWebsiteBtn: 'Website',
    aboutSpecLink: 'Specifications',
    aboutChangelogLink: 'Changelog',
    aboutShowSpecsBtn: 'Show Specifications & Architecture',
    aboutHideSpecsBtn: 'Hide Specifications & Architecture',
    aboutSpecTitle: 'Technical Specifications & Architecture',
    aboutCodecLabel: 'Supported Audio Codecs',
    aboutMetadataLabel: 'Stream Metadata Engine',
    aboutDirectoryLabel: 'Public Radio Directory',
    aboutStorageLabel: 'Local Data Storage',
    aboutLicenseLabel: 'Software License',
    aboutTechStackLabel: 'Core Technologies',
    aboutGithubLabel: 'GitHub Repository',
    openLogsBtn: 'Open Logs Folder',
    copyDiagBtn: 'Copy Diagnostics',
    copiedDiagBtn: 'Diagnostics Copied',
    diagReportTitle: 'Diagnostic Report',

    // Modals
    modalAddTitle: 'Add Radio Station',
    modalEditTitle: 'Station Details & Edit',
    fieldName: 'Station Name',
    fieldUrl: 'Stream URL (HTTP/HTTPS or Noice)',
    fieldLogo: 'Logo / Favicon URL (.png, .jpg, .ico)',
    fieldGenre: 'Genre',
    fieldCity: 'City',
    fieldGroup: 'Category / Group',
    fieldTags: 'Tags (comma-separated)',
    colType: 'Codec',
    typeAutoLocked: 'Auto-locked',
    testStreamBtn: 'Test Stream',
    testingStream: 'Testing…',
    testOkPrefix: 'Stream verified',
    testFailPrefix: 'Connection failed',
    saveBtn: 'Save Changes',
    cancelBtn: 'Cancel',
    duplicateStrategyLabel: 'Duplicate handling',
    dupSkip: 'Skip',
    dupOverwrite: 'Overwrite',
    dupDuplicate: 'Duplicate',
    copyExportBtn: 'Copy Export',
    copiedExportMsg: 'Export copied to clipboard.',
    importBtn: 'Import Playlist',
    sleepCountdownTitle: 'Sleep Timer Active',
    sleepCountdownDesc: 'Playback stops automatically in {sec}s',
    sleepCancelBtn: 'Cancel Sleep',

    // Onboarding Intro Wizard
    introWelcomeTitle: 'Welcome to Squelch',
    introWelcomeSubtitle:
        'A modern, lightweight, and elegant internet radio player living right in your macOS menu bar.',
    introWelcomeFeature1Title: 'Thousands of Global & Local Stations',
    introWelcomeFeature1Desc:
        'Instant access to over 30,000 radio stations from Indonesia and around the globe.',
    introWelcomeFeature2Title: 'Minimalist & Native to macOS',
    introWelcomeFeature2Desc:
        'Clean native glassmorphism design that uses almost no memory and stays out of your way.',
    introWelcomeFeature3Title: 'Show Schedules & Listening Stats',
    introWelcomeFeature3Desc:
        'Automatic show reminders and comprehensive listening history insights.',

    introPermsTitle: 'Permissions & System Access',
    introPermsSubtitle:
        'Set up your macOS system integration preferences for the smoothest experience.',
    introPermNotifyTitle: 'Song & Show Notifications',
    introPermNotifyDesc:
        'Receive alerts when a new song starts playing and get reminded before your favorite shows air.',
    introPermNotifyBtn: 'Allow Notifications',
    introPermNotifyGranted: 'Notifications Enabled',
    introPermStorageTitle: 'Local Data Storage',
    introPermStorageDesc:
        'Your custom stations, favorites, and settings are saved securely in local Application Support.',
    introPermStorageActive: 'Stored Safely on Device',
    introPermAutostartTitle: 'Launch at Login',
    introPermAutostartDesc:
        'Start Squelch minimized in your menu bar whenever you log into macOS.',
    introPermAutoplayTitle: 'Auto-play Last Station',
    introPermAutoplayDesc:
        'Resume playing your last listened radio station automatically when Squelch starts.',

    introCustomTitle: 'Personalization & Theme',
    introCustomSubtitle:
        'Tune the language, appearance theme, and accent color to match your desktop setup.',
    introLanguageLabel: 'Preferred Language',
    introThemeLabel: 'Appearance Theme',
    introAccentLabel: 'macOS Accent Color',

    introReadyTitle: "You're All Set!",
    introReadySubtitle:
        'Squelch is fully configured and ready to bring music and talk radio to your workday.',
    introReadyTip1:
        'Click the radio icon in your top macOS menu bar anytime to play, pause, or switch stations.',
    introReadyTip2:
        'Use the global shortcut ⌘ + Shift + P to toggle radio playback from anywhere.',
    introReadyTip3:
        'You can customize all these options later in Squelch Preferences.',
    introStartBtn: 'Start Listening',
    introNextBtn: 'Continue',
    introBackBtn: 'Back',
    introSkipBtn: 'Skip',
    introReopenBtn: 'Open Welcome Intro',

    // App Updates
    updatesSectionTitle: 'Application Updates',
    updatesSectionDesc:
        'Check for the latest version of Squelch and download new releases directly from GitHub.',
    updatesCurrentVersion: 'Installed Version',
    updatesCheckBtn: 'Check for Updates',
    updatesChecking: 'Checking GitHub…',
    updatesCheckingTitle: 'Checking for Updates...',
    updatesCheckingDesc:
        'Connecting to GitHub to check for the latest Squelch release.',
    updatesUpToDate: 'Squelch is up to date',
    updatesUpToDateDesc:
        'You are running the latest version of Squelch. No action required.',
    updatesAvailable: 'Update Available',
    updatesAutoCheck: 'Check for updates automatically on launch',
    updatesModalTitle: 'New Version Available: {ver}',
    updatesModalSubtitle:
        'A new version of Squelch is ready to download with performance improvements and new features.',
    updatesDownloadDmg: 'Download Update (.dmg)',
    updatesDownloadBackground: 'Download in Background',
    updatesDownloading: 'Downloading in background…',
    updatesDownloadDesc: 'Downloading latest installer in the background.',
    updatesBackgroundNote:
        'You can close this window. Radio playback will continue seamlessly.',
    updatesCancelDownload: 'Cancel Download',
    updatesKeepInBackground: 'Run in Background',
    updatesReadyTitle: 'Update Ready to Install',
    updatesReadySubtitle:
        'The update installer has been downloaded in the background. Open installer to update Squelch.',
    updatesInstallBtn: 'Open Installer & Install',
    updatesRevealFinderBtn: 'Reveal in Finder',
    updatesDownloadError: 'Failed to download update file.',
    updatesRetryDownload: 'Retry Download',
    updatesFallbackBrowser: 'Download Manually via Browser',
    updatesDownloadedBadge: 'Update Ready to Install',
    updatesDownloadingBadge: 'Downloading Update',
    updatesViewNotes: 'View Release Notes on GitHub',
    updatesDismiss: 'Later',
    updatesChangelogLabel: 'Release Notes',
    updatesError: 'Failed to check for updates',
    updatesRetryBtn: 'Try Again',
    updatesDoneBtn: 'Done',

    // System Notifications
    notifConnectionLostTitle: 'Connection Lost',
    notifReconnectFailedBody:
        'Failed to reconnect to {station} after {attempts} attempts. Playback stopped.',
    notifTimeoutStoppedBody:
        'Failed to connect to {station} due to network timeout. Playback stopped.'
};
