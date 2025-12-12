import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import DropdownPortal from '../common/DropdownPortal';

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
}

const GlassDropdown: React.FC<GlassDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className = '',
    menuClassName = '',
    placement = 'bottom-start'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-black/40 text-xs text-gray-300 hover:bg-white/5 hover:border-white/20 transition-all focus:outline-none focus:ring-1 focus:ring-jarvis-cyan/50 hover:text-white ${className}`}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption?.icon && <span className="opacity-70">{selectedOption.icon}</span>}
                    <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                </div>
                <ChevronDown size={14} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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
                    className={`min-w-[160px] max-h-[300px] overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a0add] backdrop-blur-xl shadow-2xl p-1 z-50 ${menuClassName}`}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-all ${option.value === value
                                    ? 'bg-jarvis-cyan/10 text-jarvis-cyan'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                }`}
                        >
                            <div className="flex items-center gap-2 truncate">
                                {option.icon && <span className="opacity-70">{option.icon}</span>}
                                <span>{option.label}</span>
                            </div>
                            {option.value === value && <Check size={12} className="opacity-75" />}
                        </button>
                    ))}
                </motion.div>
            </DropdownPortal>
        </>
    );
};

export default GlassDropdown;
