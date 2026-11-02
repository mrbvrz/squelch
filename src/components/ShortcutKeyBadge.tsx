import React from 'react';
import { formatAcceleratorToBadges } from '../utils/shortcuts';

export interface ShortcutKeyBadgeProps {
    accelerator?: string | null;
    badges?: string[];
    size?: 'sm' | 'md';
    className?: string;
    unassignedText?: string;
}

export const ShortcutKeyBadge: React.FC<ShortcutKeyBadgeProps> = ({
    accelerator,
    badges: directBadges,
    size = 'md',
    className = '',
    unassignedText = 'None'
}) => {
    const badges =
        directBadges && directBadges.length > 0
            ? directBadges
            : accelerator
              ? formatAcceleratorToBadges(accelerator)
              : [];

    if (badges.length === 0) {
        return (
            <span
                className={`text-[11px] text-secondary/60 italic font-medium ${className}`}
            >
                {unassignedText}
            </span>
        );
    }

    const keyClass =
        size === 'sm'
            ? 'px-1.5 py-0.5 min-w-[18px] text-[10px] leading-tight'
            : 'px-2 py-0.5 min-w-[22px] text-[11px] leading-tight';

    return (
        <span
            className={`inline-flex items-center gap-1 select-none ${className}`}
        >
            {badges.map((badge, idx) => (
                <kbd
                    key={`${badge}-${idx}`}
                    className={`inline-flex items-center justify-center rounded-[5px] font-mono font-semibold text-foreground bg-black/8 dark:bg-white/10 border border-black/15 dark:border-white/20 shadow-[0_1px_1px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_1px_rgba(0,0,0,0.3)] ${keyClass}`}
                >
                    {badge}
                </kbd>
            ))}
        </span>
    );
};
