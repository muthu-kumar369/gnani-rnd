import React, { useState } from 'react';
import AdvancedSearch from '../components/common/AdvancedSearch';
import { useSearchStore } from '../store/useSearchStore';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Clock, ArrowRight, Search } from 'lucide-react';


/**
 * STAGE 2: Search Page
 * Provides dedicated page for advanced search functionality
 */
export const SearchPage: React.FC = () => {
    const { results, isSearching, query } = useSearchStore();
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(true);
    const navigate = useNavigate();

    const handleResultClick = (conversationId: string) => {
        navigate(`/conversation/${conversationId}`);
    };

    const handleCloseSearch = () => {
        setIsSearchModalOpen(false);
        // Navigate back if user closes search
        navigate(-1);
    };

    return (
        <div className="flex flex-col h-screen bg-canvas text-type-primary overflow-hidden">
            <div className="px-8 py-8 border-b border-line-base bg-canvas-panel">
                <h1 className="text-3xl font-semibold mb-2 text-type-primary">Advanced Search</h1>
                <p className="text-type-secondary text-sm">
                    Search across all your conversations with powerful filters
                </p>
            </div>

            {/* Advanced Search Modal */}
            <AdvancedSearch
                isOpen={isSearchModalOpen}
                onClose={handleCloseSearch}
            />

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {isSearching && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <div className="w-10 h-10 border-4 border-line-base border-t-gnani-primary rounded-full animate-spin" />
                        <p className="text-type-secondary">Searching conversations...</p>
                    </div>
                )}

                {!isSearching && query && results.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                        <MessageSquare size={48} className="text-type-muted mb-4 opacity-50" />
                        <h3 className="text-2xl font-semibold mb-2 text-type-primary">No results found</h3>
                        <p className="text-type-secondary">Try adjusting your search query or filters</p>
                    </div>
                )}

                {!isSearching && results.length > 0 && (
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-1 text-type-primary">{results.length} result{results.length !== 1 ? 's' : ''} found</h2>
                            <p className="text-type-secondary text-sm">for "{query}"</p>
                        </div>

                        <div className="flex flex-col gap-4">
                            {results.map((result) => (
                                <div
                                    key={result.conversationId}
                                    className="bg-canvas-panel border border-line-base rounded-xl p-6 cursor-pointer hover:border-gnani-primary hover:shadow-lg transition-all transform hover:-translate-y-0.5 group"
                                    onClick={() => handleResultClick(result.conversationId)}
                                >
                                    <div className="flex justify-between items-start mb-3 gap-4">
                                        <h3 className="text-lg font-semibold text-type-primary flex-1">{result.title}</h3>
                                        <span className="text-xs px-3 py-1 bg-gnani-primary/10 text-gnani-primary rounded-full font-medium whitespace-nowrap">
                                            {Math.round(result.score * 100)}% match
                                        </span>
                                    </div>

                                    <p className="text-type-secondary mb-4 leading-relaxed line-clamp-2">{result.snippet}</p>

                                    <div className="flex items-center gap-4 text-sm text-type-muted">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} />
                                            <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {result.model && (
                                            <span className="px-3 py-1 bg-canvas-surface rounded text-xs">{result.model}</span>
                                        )}
                                        <ArrowRight size={16} className="ml-auto text-gnani-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!isSearching && !query && (
                    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                        <Search size={64} className="text-type-muted mb-4 opacity-50" />
                        <h2 className="text-2xl font-semibold mb-2 text-type-primary">Start Searching</h2>
                        <p className="text-type-secondary">Use the search bar above to find conversations</p>
                        <ul className="mt-8 text-left max-w-md space-y-2">
                            {['Search by keywords, phrases, or questions', 'Use filters to narrow down results', 'Choose between basic, semantic, or hybrid search modes'].map((tip, i) => (
                                <li key={i} className="flex items-center gap-2 text-type-secondary">
                                    <span className="text-gnani-primary font-bold">•</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
