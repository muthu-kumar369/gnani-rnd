import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { useSearchStore } from '../store/useSearchStore';

export const useSearchSuggestions = (query: string) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const debouncedQuery = useDebounce(query, 300);
    const searchHistory = useSearchStore(state => state.searchHistory);

    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < 2) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            // Get history matches first
            const historyMatches = searchHistory.filter(h =>
                h.toLowerCase().includes(debouncedQuery.toLowerCase()) &&
                h.toLowerCase() !== debouncedQuery.toLowerCase()
            ).slice(0, 3);

            // Mock backend suggestions for now (until we have an endpoint)
            const mockSuggestions = [
                `${debouncedQuery} with code`,
                `${debouncedQuery} in last week`,
                `${debouncedQuery} explanation`
            ];

            // Combine unique suggestions
            const unique = [...new Set([...historyMatches, ...mockSuggestions])];
            setSuggestions(unique.slice(0, 5));
        };

        fetchSuggestions();
    }, [debouncedQuery, searchHistory]);

    return suggestions;
};
