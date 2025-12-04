import React from 'react';
import { formatDateSeparator } from '../../utils/date-formatter';

interface DateSeparatorProps {
    timestamp: number;
}

const DateSeparator: React.FC<DateSeparatorProps> = ({ timestamp }) => {
    const dateLabel = formatDateSeparator(timestamp);

    return (
        <div className="flex items-center gap-3 my-4 px-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70 font-mono">
                {dateLabel}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        </div>
    );
};

export default DateSeparator;
