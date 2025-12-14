import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import DropdownPortal from '../common/DropdownPortal';
import { eventManager } from '../../utils/eventManager';

export interface DropdownOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface GlassDropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string; // For the trigger button
    menuClassName?: string;
    placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'right-start' | 'right-end';
    disabled?: boolean;
}

const GlassDropdown: React.FC<GlassDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className = '',
    menuClassName = '',
    placement = 'bottom-start',
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuWidth, setMenuWidth] = useState<number | undefined>(undefined);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        if (buttonRef.current) {
            setMenuWidth(buttonRef.current.offsetWidth);
        }
        const cleanup = eventManager.addEventListener('keyboard:escape', () => setIsOpen(false), undefined, 'GlassDropdown');
        return cleanup;
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <>
            <button
                ref={buttonRef}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-white/10 bg-black/40 text-sm text-slate-300 hover:bg-white/5 hover:border-white/20 transition-all focus:outline-none focus:ring-1 focus:ring-cyan-500/50 hover:text-white ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-black/40' : ''} ${className}`}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption?.icon && <span className="opacity-70">{selectedOption.icon}</span>}
                    <span className="truncate font-medium">{selectedOption ? selectedOption.label : placeholder}</span>
                </div>
                <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <DropdownPortal
                isOpen={isOpen}
                buttonRef={buttonRef}
                onClose={() => setIsOpen(false)}
                placement={placement}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className={`min-w-[160px] max-h-[300px] overflow-y-auto custom-scrollbar rounded-xl border border-white/20 bg-[#05050a]/95 backdrop-blur-3xl shadow-[0_0_50px_-10px_rgba(0,0,0,0.8)] p-1.5 z-[100] ring-1 ring-white/5 ${menuClassName}`}
                    style={{ width: menuWidth ? `${menuWidth}px` : 'auto' }}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all mb-0.5 ${option.value === value
                                ? 'bg-cyan-500/10 text-cyan-400 font-semibold'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-2 truncate">
                                {option.icon && <span className="opacity-70">{option.icon}</span>}
                                <span>{option.label}</span>
                            </div>
                            {option.value === value && <Check size={14} />}
                        </button>
                    ))}
                </motion.div>
            </DropdownPortal>
        </>
    );
};

export default GlassDropdown;
