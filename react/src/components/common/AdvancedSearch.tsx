import React, { useState, useEffect } from 'react';
import { Search, X, Filter, Calendar, Cpu, Folder, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from '../../store/useSearchStore';
import { useFolderStore } from '../../store/useFolderStore';
import api from '../../api/client';

interface AdvancedSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ isOpen, onClose }) => {
    const {
        query,
        filters,
        results,
        isSearching,
        searchHistory,
        setQuery,
        setFilters,
        setResults,
        setIsSearching,
        addToHistory,
        clearResults,
    } = useSearchStore();

    const { folders } = useFolderStore();
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsSearching(true);
        addToHistory(query);

        try {
            const response = await api.post('/search', {
                query: query.trim(),
                filters,
            });

            setResults(response.data.results || []);
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    useEffect(() => {
        if (!isOpen) {
            clearResults();
        }
    }, [isOpen, clearResults]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-20"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: -20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: -20 }}
                    className="bg-gray-900 border border-cyan-500/30 rounded-lg w-full max-w-3xl mx-4 max-h-[80vh] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Search Header */}
                    <div className="p-4 border-b border-cyan-500/30">
                        <div className="flex items-center gap-3 mb-3">
                            <Search size={20} className="text-cyan-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search conversations..."
                                className="flex-1 bg-transparent text-cyan-400 placeholder-cyan-500/40 focus:outline-none text-lg"
                                autoFocus
                            />
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2 rounded transition-colors ${showFilters ? 'bg-cyan-500/20 text-cyan-400' : 'text-cyan-500/60 hover:text-cyan-400'
                                    }`}
                                title="Filters"
                            >
                                <Filter size={18} />
                            </button>
                            <button
                                onClick={onClose}
                                className="text-cyan-500/60 hover:text-cyan-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Filters */}
                        {showFilters && (
                            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-cyan-500/20">
                                {/* Date Range */}
                                <div>
                                    <label className="block text-xs text-cyan-500/60 mb-1">
                                        <Calendar size={12} className="inline mr-1" />
                                        Date From
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.dateFrom || ''}
                                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                        className="w-full px-2 py-1 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 text-sm focus:outline-none focus:border-cyan-500"
                                    />
                                </div>

                                {/* Model Filter */}
                                <div>
                                    <label className="block text-xs text-cyan-500/60 mb-1">
                                        <Cpu size={12} className="inline mr-1" />
                                        Model
                                    </label>
                                    <select
                                        value={filters.model || ''}
                                        onChange={(e) => setFilters({ ...filters, model: e.target.value })}
                                        className="w-full px-2 py-1 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 text-sm focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="">All Models</option>
                                        <option value="gpt-4">GPT-4</option>
                                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                        <option value="claude-3">Claude 3</option>
                                    </select>
                                </div>

                                {/* Folder Filter */}
                                <div>
                                    <label className="block text-xs text-cyan-500/60 mb-1">
                                        <Folder size={12} className="inline mr-1" />
                                        Folder
                                    </label>
                                    <select
                                        value={filters.folder || ''}
                                        onChange={(e) => setFilters({ ...filters, folder: e.target.value })}
                                        className="w-full px-2 py-1 bg-black/40 border border-cyan-500/30 rounded text-cyan-400 text-sm focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="">All Folders</option>
                                        {folders.map((folder) => (
                                            <option key={folder.id} value={folder.id}>
                                                {folder.icon} {folder.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Search History */}
                        {!query && searchHistory.length > 0 && (
                            <div className="pt-3 border-t border-cyan-500/20 mt-3">
                                <div className="flex items-center gap-2 text-xs text-cyan-500/60 mb-2">
                                    <Clock size={12} />
                                    Recent Searches
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {searchHistory.slice(0, 5).map((historyQuery, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setQuery(historyQuery)}
                                            className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs rounded transition-colors"
                                        >
                                            {historyQuery}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {isSearching ? (
                            <div className="text-center text-cyan-500/60 py-8">
                                Searching...
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-2">
                                {results.map((result) => (
                                    <div
                                        key={result.conversationId}
                                        className="p-3 bg-black/40 border border-cyan-500/20 rounded hover:border-cyan-500/40 transition-colors cursor-pointer"
                                    >
                                        <h3 className="text-cyan-400 font-medium mb-1">{result.title}</h3>
                                        <p className="text-cyan-500/60 text-sm mb-2">{result.snippet}</p>
                                        <div className="flex items-center gap-3 text-xs text-cyan-500/50">
                                            <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                                            {result.model && <span>• {result.model}</span>}
                                            <span>• Score: {result.score.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : query ? (
                            <div className="text-center text-cyan-500/60 py-8">
                                No results found
                            </div>
                        ) : null}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AdvancedSearch;
