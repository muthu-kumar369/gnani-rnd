import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SearchFilters {
    dateFrom?: string;
    dateTo?: string;
    models?: string[]; // Arrays for multi-select
    folders?: string[];
    tags?: string[];
}

export interface SearchResult {
    conversationId: string;
    title: string;
    snippet: string;
    score: number;
    createdAt: string;
    model?: string;
}

interface SearchState {
    query: string;
    filters: SearchFilters;
    results: SearchResult[];
    isSearching: boolean;
    searchHistory: string[];
    setQuery: (query: string) => void;
    setFilters: (filters: SearchFilters) => void;
    setResults: (results: SearchResult[]) => void;
    setIsSearching: (isSearching: boolean) => void;
    addToHistory: (query: string) => void;
    clearHistory: () => void;
    clearResults: () => void;
}

export const useSearchStore = create<SearchState>()(
    persist(
        (set) => ({
            query: '',
            filters: {},
            results: [],
            isSearching: false,
            searchHistory: [],

            setQuery: (query: string) => set({ query }),

            setFilters: (filters: SearchFilters) => set({ filters }),

            setResults: (results: SearchResult[]) => set({ results }),

            setIsSearching: (isSearching: boolean) => set({ isSearching }),

            addToHistory: (query: string) => {
                if (!query.trim()) return;
                set((state) => ({
                    searchHistory: [
                        query,
                        ...state.searchHistory.filter((q) => q !== query),
                    ].slice(0, 10), // Keep last 10 searches
                }));
            },

            clearHistory: () => set({ searchHistory: [] }),

            clearResults: () => set({ results: [], query: '' }),
        }),
        {
            name: 'gnani-search',
            partialize: (state) => ({ searchHistory: state.searchHistory }),
        }
    )
);
