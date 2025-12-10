import React, { useState } from 'react';
import { Calendar, Tag, Folder, Cpu, X, Filter } from 'lucide-react';
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
    const [showFilters, setShowFilters] = useState(false);

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

    return (
        <div className="relative z-10">
            <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${showFilters || hasFilters
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
            >
                <Filter size={14} />
                Filters
                {hasFilters && (
                    <span className="ml-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        {Object.keys(filters).length}
                    </span>
                )}
            </button>

            {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-xl p-4 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium text-white">Search Filters</h3>
                        {hasFilters && (
                            <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300">
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Date Range */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs text-gray-400">
                                <Calendar size={12} />
                                Date Range
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="date"
                                    className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                    value={filters.dateFrom || ''}
                                    onChange={(e) => handleFilterChange({ ...filters, dateFrom: e.target.value })}
                                />
                                <input
                                    type="date"
                                    className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                    value={filters.dateTo || ''}
                                    onChange={(e) => handleFilterChange({ ...filters, dateTo: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Model Filter */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs text-gray-400">
                                <Cpu size={12} />
                                Model
                            </label>
                            <select
                                className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                value={filters.models?.[0] || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    handleFilterChange({ ...filters, models: val ? [val] : undefined });
                                }}
                            >
                                <option value="">All Models</option>
                                <option value="gpt-4">GPT-4</option>
                                <option value="gemma:2b">Gemma 2B</option>
                                <option value="claude-3">Claude 3</option>
                            </select>
                        </div>

                        {/* Folder Filter */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs text-gray-400">
                                <Folder size={12} />
                                Folder
                            </label>
                            <select
                                className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                value={filters.folders?.[0] || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    handleFilterChange({ ...filters, folders: val ? [val] : undefined });
                                }}
                            >
                                <option value="">All Folders</option>
                                {folders.map((folder) => (
                                    <option key={folder.id} value={folder.id}>
                                        {folder.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tags Filter */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs text-gray-400">
                                <Tag size={12} />
                                Tags
                            </label>
                            <input
                                type="text"
                                placeholder="Comma separated tags"
                                className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                value={filters.tags?.join(', ') || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const tags = val.split(',').map(t => t.trim()).filter(Boolean);
                                    handleFilterChange({ ...filters, tags: tags.length ? tags : undefined });
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
