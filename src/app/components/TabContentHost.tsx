import React from 'react';
import type {
    AppSettings,
    ListeningStatsSummary
} from '../../types';
import type { ActiveTab } from '../types';

import { StationsTab, type StationsTabProps } from '../tabs/StationsTab';
import { SchedulesTab, type SchedulesTabProps } from '../tabs/SchedulesTab';
import { DiscoverTab, type DiscoverTabProps } from '../tabs/DiscoverTab';
import { StatsTab, type StatsTabProps } from '../tabs/StatsTab';
import { PreferencesTab, type PreferencesTabProps } from '../tabs/PreferencesTab';
import { AboutTab, type AboutTabProps } from '../tabs/AboutTab';

export interface TabContentHostProps {
    activeTab: ActiveTab;
    stationsProps: StationsTabProps;
    schedulesProps: SchedulesTabProps;
    discoverProps: DiscoverTabProps;
    statsSummary: ListeningStatsSummary | null;
    statsProps: StatsTabProps;
    settings: AppSettings | null;
    preferencesProps: PreferencesTabProps;
    aboutProps: AboutTabProps;
}

export const TabContentHost: React.FC<TabContentHostProps> = ({
    activeTab,
    stationsProps,
    schedulesProps,
    discoverProps,
    statsSummary,
    statsProps,
    settings,
    preferencesProps,
    aboutProps
}) => {
    switch (activeTab) {
        case 'stations':
            return <StationsTab {...stationsProps} />;
        case 'schedules':
            return <SchedulesTab {...schedulesProps} />;
        case 'discover':
            return <DiscoverTab {...discoverProps} />;
        case 'stats':
            return statsSummary ? <StatsTab {...statsProps} /> : null;
        case 'preferences':
            return settings ? <PreferencesTab {...preferencesProps} /> : null;
        case 'about':
            return <AboutTab {...aboutProps} />;
        default:
            return null;
    }
};
