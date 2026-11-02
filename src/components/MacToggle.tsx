import React from 'react';

export interface MacToggleProps {
    checked: boolean;
    onChange: (next: boolean) => void;
    label: string;
}

export const MacToggle: React.FC<MacToggleProps> = ({
    checked,
    onChange,
    label
}) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`w-10 h-[22px] rounded-full p-0.5 transition-colors cursor-pointer flex items-center shrink-0 ${
            checked
                ? 'bg-accent'
                : 'bg-black/20 dark:bg-white/15 border mac-divider'
        }`}
    >
        <span
            className={`w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
                checked ? 'translate-x-[18px]' : 'translate-x-0'
            }`}
        />
    </button>
);
