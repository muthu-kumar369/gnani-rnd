import React, { useState } from 'react';
import AdvancedSearch from '../components/common/AdvancedSearch';
import { useSearchStore } from '../store/useSearchStore';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Clock, ArrowRight, Search } from 'lucide-react';
import './SearchPage.css';

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
        <div className="search-page">
            <div className="search-page-header">
                <h1>Advanced Search</h1>
                <p className="search-page-subtitle">
                    Search across all your conversations with powerful filters
                </p>
            </div>

            {/* Advanced Search Modal */}
            <AdvancedSearch
                isOpen={isSearchModalOpen}
                onClose={handleCloseSearch}
            />

            {/* Search Results */}
            <div className="search-results-container">
                {isSearching && (
                    <div className="search-loading">
                        <div className="loading-spinner" />
                        <p>Searching conversations...</p>
                    </div>
                )}

                {!isSearching && query && results.length === 0 && (
                    <div className="search-empty">
                        <MessageSquare size={48} className="empty-icon" />
                        <h3>No results found</h3>
                        <p>Try adjusting your search query or filters</p>
                    </div>
                )}

                {!isSearching && results.length > 0 && (
                    <div className="search-results">
                        <div className="results-header">
                            <h2>{results.length} result{results.length !== 1 ? 's' : ''} found</h2>
                            <p>for "{query}"</p>
                        </div>

                        <div className="results-list">
                            {results.map((result) => (
                                <div
                                    key={result.conversationId}
                                    className="search-result-item"
                                    onClick={() => handleResultClick(result.conversationId)}
                                >
                                    <div className="result-header">
                                        <h3 className="result-title">{result.title}</h3>
                                        <span className="result-score">
                                            {Math.round(result.score * 100)}% match
                                        </span>
                                    </div>

                                    <p className="result-snippet">{result.snippet}</p>

                                    <div className="result-footer">
                                        <div className="result-meta">
                                            <Clock size={14} />
                                            <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {result.model && (
                                            <span className="result-model">{result.model}</span>
                                        )}
                                        <ArrowRight size={16} className="result-arrow" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!isSearching && !query && (
                    <div className="search-prompt">
                        <Search size={64} className="prompt-icon" />
                        <h2>Start Searching</h2>
                        <p>Use the search bar above to find conversations</p>
                        <ul className="search-tips">
                            <li>Search by keywords, phrases, or questions</li>
                            <li>Use filters to narrow down results</li>
                            <li>Choose between basic, semantic, or hybrid search modes</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
