import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import DropdownPortal from '../common/DropdownPortal';
import { eventManager } from '../../utils/eventManager';
import { useThemeStore } from '../../store/themeStore';

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
    triggerIcon?: React.ReactNode;
    showArrow?: boolean;
    labelClassName?: string;
}

const GlassDropdown: React.FC<GlassDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className = '',
    menuClassName = '',
    placement = 'bottom-start',
    disabled = false,
    triggerIcon,
    showArrow = true,
    labelClassName = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuWidth, setMenuWidth] = useState<number | undefined>(undefined);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { theme } = useThemeStore();

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
                title={selectedOption ? selectedOption.label : placeholder}
                className={`flex items-center justify-between gap-2 px-4 rounded-xl border border-glass-border bg-canvas-surface/40 text-sm text-type-secondary hover:bg-glass-shimmer hover:border-gnani-primary/30 transition-all focus:outline-none focus:ring-1 focus:ring-gnani-primary/50 hover:text-type-primary ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-canvas-surface/40' : 'cursor-pointer'} ${className}`}
            >
                {triggerIcon ? (
                    <div className="flex items-center gap-2">
                        {triggerIcon}
                        <span className={`truncate font-medium ${labelClassName}`}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 truncate">
                        {selectedOption?.icon && <span className="opacity-70">{selectedOption.icon}</span>}
                        <span className="truncate font-medium">{selectedOption ? selectedOption.label : placeholder}</span>
                    </div>
                )}
                {showArrow && <ChevronDown size={16} className={`text-type-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
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
                    className={`min-w-[160px] max-h-[300px] overflow-y-auto custom-scrollbar rounded-xl bg-canvas-popover p-1.5 z-[100] ${menuClassName}`}
                    style={{ width: menuWidth ? `${menuWidth}px` : 'auto', boxShadow: 'var(--shadow-popover)', background: 'var(--bg-popover)' }}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all mb-0.5 ${option.value === value
                                ? theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400 font-semibold' : 'bg-cyan-500/10 text-cyan-700 font-semibold'
                                : theme === 'dark'
                                    ? 'text-gray-300 hover:bg-white/5 hover:text-white'
                                    : 'text-gray-600 hover:bg-black/5 hover:text-gray-900'
                                } cursor-pointer`}
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
