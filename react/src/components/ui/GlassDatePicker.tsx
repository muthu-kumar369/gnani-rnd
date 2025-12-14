import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import DropdownPortal from '../common/DropdownPortal';
import { motion, type Variants } from 'framer-motion';

interface GlassDatePickerProps {
    value?: string | Date;
    onChange: (date: string) => void;
    placeholder?: string;
    className?: string;
    label?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type ViewMode = 'day' | 'month' | 'year';

const GlassDatePicker: React.FC<GlassDatePickerProps> = ({
    value,
    onChange,
    placeholder = "Select date",
    className = "",
    label
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

    // Parse initial value or default to today for the calendar view
    const initialDate = value ? new Date(value) : new Date();
    const validDate = !isNaN(initialDate.getTime()) ? initialDate : new Date();

    const [viewDate, setViewDate] = useState(validDate);
    const [selectedDate, setSelectedDate] = useState<Date | null>(value ? validDate : null);

    // View Mode State: 'day' (default), 'month', 'year'
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    // For year view pagination (12 years per page)
    const [yearPageStart, setYearPageStart] = useState(validDate.getFullYear() - 6);

    // Update internal state when prop changes
    useEffect(() => {
        if (value) {
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
                setSelectedDate(d);
                setViewDate(d);
            }
        } else {
            setSelectedDate(null);
        }
    }, [value]);

    useEffect(() => {
        if (isOpen) {
            // Reset to day view on open
            setViewMode('day');
            // Center year view on current viewDate
            setYearPageStart(viewDate.getFullYear() - 6);
        }
    }, [isOpen]);


    // Helper to emit date change
    const emitDateChange = (date: Date) => {
        // Adjust for timezone offset to ensure "YYYY-MM-DD" is correct relative to local time
        const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        onChange(offsetDate.toISOString().split('T')[0]);
        setSelectedDate(date);
    };

    // --- Handlers ---

    const handleDaySelect = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        emitDateChange(newDate);
        setIsOpen(false);
    };

    const handleMonthSelect = (monthIndex: number) => {
        setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
        setViewMode('day');
    };

    const handleYearSelect = (year: number) => {
        setViewDate(new Date(year, viewDate.getMonth(), 1));
        setViewMode('day');
    };

    const handleHeaderNav = (delta: number) => {
        if (viewMode === 'day') {
            // Change Month
            setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
        } else if (viewMode === 'year') {
            // Change Year Page (12 years)
            setYearPageStart(prev => prev + (delta * 12));
        } else {
            // Change Year in Month view
            setViewDate(new Date(viewDate.getFullYear() + delta, viewDate.getMonth(), 1));
        }
    };

    const toggleViewMode = (mode: ViewMode) => {
        if (viewMode === mode) {
            setViewMode('day');
        } else {
            setViewMode(mode);
            if (mode === 'year') {
                setYearPageStart(viewDate.getFullYear() - 6);
            }
        }
    };

    // --- Renderers ---

    const renderDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const days = [];

        // Header
        const headers = DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {d}
            </div>
        ));

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const isSelected = selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === month &&
                selectedDate.getFullYear() === year;

            const isToday = new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

            days.push(
                <button
                    key={day}
                    onClick={(e) => { e.stopPropagation(); handleDaySelect(day); }}
                    className={`h-8 w-8 rounded-full text-xs font-medium flex items-center justify-center transition-all
                        ${isSelected
                            ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }
                        ${!isSelected && isToday ? 'border border-cyan-500/50 text-cyan-400' : ''}
                    `}
                >
                    {day}
                </button>
            );
        }

        return (
            <>
                <div className="grid grid-cols-7 mb-1">{headers}</div>
                <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                    {days}
                </div>
            </>
        );
    };

    const renderMonths = () => {
        return (
            <div className="grid grid-cols-3 gap-2 h-[220px]">
                {MONTHS.map((m, i) => (
                    <button
                        key={m}
                        onClick={(e) => { e.stopPropagation(); handleMonthSelect(i); }}
                        className={`text-xs font-medium rounded-lg hover:bg-white/5 transition-colors
                            ${viewDate.getMonth() === i ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-300'}
                        `}
                    >
                        {m.substring(0, 3)}
                    </button>
                ))}
            </div>
        );
    };

    const renderYears = () => {
        const years = Array.from({ length: 12 }, (_, i) => yearPageStart + i);
        return (
            <div className="grid grid-cols-3 gap-2 h-[220px]">
                {years.map(y => (
                    <button
                        key={y}
                        onClick={(e) => { e.stopPropagation(); handleYearSelect(y); }}
                        className={`text-xs font-medium rounded-lg hover:bg-white/5 transition-colors
                            ${viewDate.getFullYear() === y ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-300'}
                        `}
                    >
                        {y}
                    </button>
                ))}
            </div>
        );
    };

    // Animation variants
    const contentVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 }
    };

    return (
        <div className={`relative ${className}`}>
            {/* Input Trigger */}
            <div
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 
                    text-sm flex items-center justify-between cursor-pointer 
                    transition-all hover:border-white/20 hover:bg-black/50
                    ${isOpen ? 'border-cyan-500/50 ring-1 ring-cyan-500/50' : ''}
                `}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <CalendarIcon size={16} className="text-slate-500" />
                    <span className={`truncate ${selectedDate ? 'text-white' : 'text-slate-500'}`}>
                        {selectedDate ? selectedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : placeholder}
                    </span>
                </div>
                {selectedDate && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange('');
                            setSelectedDate(null);
                        }}
                        className="p-1 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Dropdown Calendar Portal */}
            <DropdownPortal
                isOpen={isOpen}
                buttonRef={triggerRef}
                onClose={() => setIsOpen(false)}
                placement="bottom-start"
            >
                <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={contentVariants}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="p-4 w-[280px] bg-[#0f0f1a]/95 border border-white/10 backdrop-blur-xl rounded-xl shadow-[0_0_50px_-10px_rgba(0,0,0,0.8)] ring-1 ring-white/5 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => handleHeaderNav(-1)} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
                            <ChevronLeft size={18} />
                        </button>

                        <div className="flex gap-1">
                            <button
                                onClick={() => toggleViewMode('month')}
                                className={`px-2 py-1 rounded-md text-sm font-bold transition-colors ${viewMode === 'month' ? 'bg-white/10 text-white' : 'text-slate-200 hover:bg-white/5'}`}
                            >
                                {MONTHS[viewDate.getMonth()]}
                            </button>
                            <button
                                onClick={() => toggleViewMode('year')}
                                className={`px-2 py-1 rounded-md text-sm font-bold transition-colors ${viewMode === 'year' ? 'bg-white/10 text-white' : 'text-slate-200 hover:bg-white/5'}`}
                            >
                                {viewDate.getFullYear()}
                            </button>
                        </div>

                        <button onClick={() => handleHeaderNav(1)} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <motion.div
                        key={viewMode}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {viewMode === 'day' && renderDays()}
                        {viewMode === 'month' && renderMonths()}
                        {viewMode === 'year' && renderYears()}
                    </motion.div>

                </motion.div>
            </DropdownPortal>
        </div>
    );
};

export default GlassDatePicker;
