import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Tag, Folder, Cpu, X, Filter, RefreshCw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFolderStore } from '../../store/useFolderStore';

interface SearchFiltersProps {
    onFilterChange: (filters: SearchFiltersState) => void;
    initialFilters?: SearchFiltersState;
}

export interface SearchFiltersState {
    dateFrom?: string;
    dateTo?: string;
    models?: string[];
    folders?: string[];
    tags?: string[];
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ onFilterChange, initialFilters = {} }) => {
    const { folders } = useFolderStore();
    const [filters, setFilters] = useState<SearchFiltersState>(initialFilters);
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, right: 0 });

    const handleFilterChange = (newFilters: SearchFiltersState) => {
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        const empty = {};
        setFilters(empty);
        onFilterChange(empty);
    };

    const hasFilters = Object.keys(filters).length > 0;

    const toggleOpen = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 12,
                right: window.innerWidth - rect.right
            });
        }
        setIsOpen(!isOpen);
    };

    // Close on scroll to prevent detached floating
    useEffect(() => {
        if (isOpen) {
            const handleScroll = () => setIsOpen(false);
            window.addEventListener('scroll', handleScroll, true);
            return () => window.removeEventListener('scroll', handleScroll, true);
        }
    }, [isOpen]);

    return (
        <>
            <button
                ref={buttonRef}
                onClick={toggleOpen}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${isOpen || hasFilters
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                    : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-gray-200'
                    }`}
            >
                <Filter size={14} className={hasFilters ? 'text-cyan-400' : 'group-hover:text-cyan-400 transition-colors'} />
                <span>Filters</span>
                {hasFilters && (
                    <span className="ml-0.5 bg-cyan-500 text-black text-[10px] font-bold px-1.5 rounded-full min-w-[1.2em] text-center">
                        {Object.keys(filters).length}
                    </span>
                )}
            </button>

            {/* Portal Dropdown */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Invisible Backdrop for Click Outside */}
                            <div
                                className="fixed inset-0 z-[150] bg-transparent"
                                onClick={() => setIsOpen(false)}
                            />

                            {/* Dropdown Panel */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="fixed z-[160] w-80 bg-[#121212]/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl p-5 overflow-hidden ring-1 ring-white/5"
                                style={{
                                    top: coords.top,
                                    right: coords.right
                                }}
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Glossy Header */}
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-purple-500/50 opacity-50" />

                                <div className="flex justify-between items-center mb-5">
                                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Filter size={14} className="text-cyan-400" />
                                        Refine Search
                                    </h3>
                                    {hasFilters && (
                                        <button
                                            onClick={clearFilters}
                                            className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition-colors bg-red-500/10 px-2 py-1 rounded-md"
                                        >
                                            <Trash2 size={10} />
                                            Clear
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-5">
                                    {/* Date Grid */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                                            <Calendar size={12} />
                                            Timeline
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="relative group">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">From</span>
                                                <input
                                                    type="date"
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 pl-9 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 focus:bg-white/5 transition-all text-right"
                                                    value={filters.dateFrom || ''}
                                                    onChange={(e) => handleFilterChange({ ...filters, dateFrom: e.target.value })}
                                                />
                                            </div>
                                            <div className="relative group">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">To</span>
                                                <input
                                                    type="date"
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 pl-6 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 focus:bg-white/5 transition-all text-right"
                                                    value={filters.dateTo || ''}
                                                    onChange={(e) => handleFilterChange({ ...filters, dateTo: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Model & Folder Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                                                <Cpu size={12} />
                                                Model
                                            </label>
                                            <select
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 focus:bg-white/5 transition-all appearance-none cursor-pointer"
                                                value={filters.models?.[0] || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    handleFilterChange({ ...filters, models: val ? [val] : undefined });
                                                }}
                                            >
                                                <option value="">Any Model</option>
                                                <option value="gpt-4">GPT-4</option>
                                                <option value="gemma:2b">Gemma 2B</option>
                                                <option value="claude-3">Claude 3</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                                                <Folder size={12} />
                                                Folder
                                            </label>
                                            <select
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 focus:bg-white/5 transition-all appearance-none cursor-pointer"
                                                value={filters.folders?.[0] || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    handleFilterChange({ ...filters, folders: val ? [val] : undefined });
                                                }}
                                            >
                                                <option value="">Any Folder</option>
                                                {folders.map((folder) => (
                                                    <option key={folder.id} value={folder.id}>
                                                        {folder.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                                            <Tag size={12} />
                                            Tags
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="e.g. #coding, #ideas"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 focus:bg-white/5 transition-all placeholder-gray-600"
                                                value={filters.tags?.join(', ') || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const tags = val.split(',').map(t => t.trim()).filter(Boolean);
                                                    handleFilterChange({ ...filters, tags: tags.length ? tags : undefined });
                                                }}
                                            />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-mono">
                                                CSV
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};
