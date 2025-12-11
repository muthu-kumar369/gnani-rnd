import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from '../../store/useSearchStore';
import api from '../../api/client';
import { SearchFilters, type SearchFiltersState } from './SearchFilters';
import { SearchHighlight } from './SearchHighlight';
import { useSearchSuggestions } from '../../hooks/useSearchSuggestions';

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
        searchMode,
        setQuery,
        setFilters,
        setSearchMode,
        search,
        addToHistory,
        clearResults,
    } = useSearchStore();

    // Map store filters to component filters state
    const currentCompFilters: SearchFiltersState = {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        models: filters.models,
        folders: filters.folders,
        tags: filters.tags,
    };

    const suggestions = useSearchSuggestions(query);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Use store's search method instead of direct API call
    const handleSearch = () => {
        if (!query.trim()) return;
        addToHistory(query);
        setShowSuggestions(false);
        search(); // Use store method
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleFilterChange = (newFilters: SearchFiltersState) => {
        setFilters({
            ...newFilters,
            // Ensure compatibility
            models: newFilters.models,
            folders: newFilters.folders,
        });
        // Optional: Auto-search on filter change if query exists
        if (query) {
            // Debounce or just wait for user to hit enter? 
            // Better wait for Enter to avoid spamming
        }
    };

    // Debounced auto-search when query or filters change
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                search();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query, filters, searchMode]);

    useEffect(() => {
        if (!isOpen) {
            clearResults();
        } else {
            // Focus input when opened
            setTimeout(() => searchInputRef.current?.focus(), 100);
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
                <div className="w-full max-w-3xl mx-4 relative" onClick={(e) => e.stopPropagation()}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -20 }}
                        className="bg-gray-900 border border-cyan-500/30 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        {/* Search Header */}
                        <div className="p-4 border-b border-cyan-500/30 bg-gray-900/95 backdrop-blur z-20">
                            <div className="flex items-center gap-3">
                                <Search size={20} className="text-cyan-400" />
                                <div className="flex-1 relative">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => {
                                            setQuery(e.target.value);
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Search conversations..."
                                        className="w-full bg-transparent text-cyan-400 placeholder-cyan-500/40 focus:outline-none text-lg"
                                        autoFocus
                                    />

                                    {/* Suggestions Dropdown */}
                                    {showSuggestions && (query || searchHistory.length > 0) && (results.length === 0 || query !== results[0]?.title) && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-cyan-500/20 rounded-lg shadow-xl overflow-hidden z-30">
                                            {/* Live Suggestions */}
                                            {suggestions.length > 0 && (
                                                <div className="py-2">
                                                    {suggestions.map((s, i) => (
                                                        <button
                                                            key={`s-${i}`}
                                                            className="w-full text-left px-4 py-2 hover:bg-cyan-500/10 text-cyan-100 text-sm flex items-center gap-2"
                                                            onClick={() => {
                                                                setQuery(s);
                                                                handleSearch();
                                                            }}
                                                        >
                                                            <Search size={12} className="text-cyan-500/60" />
                                                            <SearchHighlight text={s} searchTerm={query} />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* History Suggestions */}
                                            {searchHistory.length > 0 && (!query || suggestions.length === 0) && (
                                                <div className="py-2 border-t border-cyan-500/10">
                                                    <div className="px-4 py-1 text-xs text-cyan-500/40 font-medium">Recent</div>
                                                    {searchHistory.map((h, i) => (
                                                        <button
                                                            key={`h-${i}`}
                                                            className="w-full text-left px-4 py-2 hover:bg-cyan-500/10 text-cyan-200/70 text-sm flex items-center gap-2"
                                                            onClick={() => {
                                                                setQuery(h);
                                                                handleSearch();
                                                            }}
                                                        >
                                                            <Clock size={12} className="text-cyan-500/40" />
                                                            {h}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Search Mode Selector */}
                                <div className="flex gap-2 mt-3">
                                    {(['basic', 'semantic', 'hybrid'] as const).map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setSearchMode(mode)}
                                            className={`px-4 py-2 rounded-lg capitalize transition-colors text-sm ${searchMode === mode
                                                ? 'bg-cyan-600 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>

                                <SearchFilters
                                    initialFilters={currentCompFilters}
                                    onFilterChange={handleFilterChange}
                                />

                                <button
                                    onClick={onClose}
                                    className="text-cyan-500/60 hover:text-cyan-400 ml-2"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-900/50">
                            {isSearching ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="space-y-3">
                                    <h3 className="text-xs text-cyan-500/40 uppercase tracking-wider font-semibold mb-2">Results</h3>
                                    {results.map((result) => (
                                        <div
                                            key={result.conversationId}
                                            className="p-4 bg-black/40 border border-cyan-500/10 rounded-lg hover:border-cyan-500/40 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-cyan-400 font-medium group-hover:text-cyan-300 transition-colors">
                                                    <SearchHighlight text={result.title} searchTerm={query} />
                                                </h3>
                                                <span className="text-xs text-cyan-500/30">
                                                    {new Date(result.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <p className="text-cyan-500/60 text-sm mb-3 line-clamp-2">
                                                <SearchHighlight text={result.snippet} searchTerm={query} />
                                            </p>

                                            <div className="flex items-center gap-3 text-xs text-cyan-500/40">
                                                {result.model && (
                                                    <span className="px-2 py-0.5 bg-cyan-500/5 rounded-full border border-cyan-500/10">
                                                        {result.model}
                                                    </span>
                                                )}
                                                <span>Score: {(result.score).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : query && !showSuggestions ? (
                                <div className="text-center text-cyan-500/60 py-12">
                                    <p>No results found for "{query}"</p>
                                    <p className="text-sm mt-2 opacity-50">Try adjusting your filters or search terms</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-cyan-500/20">
                                    <Search size={48} className="mb-4 opacity-20" />
                                    <p>Search your conversation history</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AdvancedSearch;
