import React from 'react';
import {
    AdjustmentsHorizontalIcon,
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ArrowsUpDownIcon,
    ArrowTopRightOnSquareIcon,
    ArrowUpTrayIcon,
    BellAlertIcon,
    BoltIcon,
    CalendarDaysIcon,
    ChartBarIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    ClipboardDocumentIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    FolderOpenIcon,
    GlobeAltIcon,
    InformationCircleIcon,
    KeyIcon,
    MagnifyingGlassIcon,
    PauseIcon,
    PencilSquareIcon,
    PlayIcon,
    PlusIcon,
    PowerIcon,
    SignalIcon,
    StarIcon as StarSolidIcon,
    StopIcon,
    SwatchIcon,
    TrashIcon,
    XMarkIcon
} from '@heroicons/react/20/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

export interface IconProps {
    size?: number;
    className?: string;
}

function wrapHeroicon(
    HeroComp: React.ComponentType<React.SVGProps<SVGSVGElement>>
): React.FC<IconProps> {
    return ({ size = 16, className = '' }) => (
        <HeroComp
            width={size}
            height={size}
            style={{ width: size, height: size }}
            className={className}
            aria-hidden="true"
        />
    );
}

export const IconRadioTower = wrapHeroicon(SignalIcon);
export const IconPlay = wrapHeroicon(PlayIcon);
export const IconPause = wrapHeroicon(PauseIcon);
export const IconStop = wrapHeroicon(StopIcon);
export const IconSearch = wrapHeroicon(MagnifyingGlassIcon);
export const IconSpinner = wrapHeroicon(ArrowPathIcon);
export const IconPlus = wrapHeroicon(PlusIcon);
export const IconCompass = wrapHeroicon(GlobeAltIcon);
export const IconGlobe = wrapHeroicon(GlobeAltIcon);
export const IconSliders = wrapHeroicon(AdjustmentsHorizontalIcon);
export const IconPower = wrapHeroicon(PowerIcon);
export const IconTimer = wrapHeroicon(ClockIcon);
export const IconPulse = wrapHeroicon(BoltIcon);
export const IconTransfer = wrapHeroicon(ArrowsUpDownIcon);
export const IconFolder = wrapHeroicon(FolderOpenIcon);
export const IconCopy = wrapHeroicon(ClipboardDocumentIcon);
export const IconChart = wrapHeroicon(ChartBarIcon);
export const IconSwatch = wrapHeroicon(SwatchIcon);
export const IconInfo = wrapHeroicon(InformationCircleIcon);
export const IconEdit = wrapHeroicon(PencilSquareIcon);
export const IconTrash = wrapHeroicon(TrashIcon);
export const IconClose = wrapHeroicon(XMarkIcon);
export const IconChevronLeft = wrapHeroicon(ChevronLeftIcon);
export const IconChevronRight = wrapHeroicon(ChevronRightIcon);
export const IconChevronDown = wrapHeroicon(ChevronDownIcon);
export const IconChevronUp = wrapHeroicon(ChevronUpIcon);
export const IconBackup = wrapHeroicon(ArrowDownTrayIcon);
export const IconRestore = wrapHeroicon(ArrowUpTrayIcon);
export const IconKey = wrapHeroicon(KeyIcon);
export const IconWarning = wrapHeroicon(ExclamationTriangleIcon);
export const IconExternalLink = wrapHeroicon(ArrowTopRightOnSquareIcon);
export const IconCheck = wrapHeroicon(CheckIcon);
export const IconCalendar = wrapHeroicon(CalendarDaysIcon);
export const IconBell = wrapHeroicon(BellAlertIcon);

export const IconGitHub: React.FC<IconProps> = ({
    size = 15,
    className = ''
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
    >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
    </svg>
);

export const IconStar: React.FC<IconProps & { filled?: boolean }> = ({
    size = 15,
    className = '',
    filled = false
}) => {
    const Comp = filled ? StarSolidIcon : StarOutlineIcon;
    return (
        <Comp
            width={size}
            height={size}
            style={{ width: size, height: size }}
            className={className}
            aria-hidden="true"
        />
    );
};
