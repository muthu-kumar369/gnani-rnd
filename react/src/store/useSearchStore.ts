import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/client';

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
    searchMode: 'basic' | 'semantic' | 'hybrid';
    setQuery: (query: string) => void;
    setFilters: (filters: SearchFilters) => void;
    setResults: (results: SearchResult[]) => void;
    setIsSearching: (isSearching: boolean) => void;
    setSearchMode: (mode: 'basic' | 'semantic' | 'hybrid') => void;
    search: () => Promise<void>;
    addToHistory: (query: string) => void;
    clearHistory: () => void;
    clearResults: () => void;
}

export const useSearchStore = create<SearchState>()(
    persist(
        (set, get) => ({
            query: '',
            filters: {},
            results: [],
            isSearching: false,
            searchHistory: [],
            searchMode: 'hybrid',

            setQuery: (query: string) => set({ query }),

            setFilters: (filters: SearchFilters) => set({ filters }),

            setResults: (results: SearchResult[]) => set({ results }),

            setIsSearching: (isSearching: boolean) => set({ isSearching }),

            setSearchMode: (mode: 'basic' | 'semantic' | 'hybrid') => set({ searchMode: mode }),

            search: async () => {
                const { query, filters, searchMode } = get();

                if (!query.trim()) {
                    set({ results: [] });
                    return;
                }

                set({ isSearching: true });

                try {
                    const response = await apiClient.post('/search', {
                        query,
                        mode: searchMode,
                        filters: {
                            dateFrom: filters.dateFrom,
                            dateTo: filters.dateTo,
                            models: filters.models,
                            folders: filters.folders,
                            tags: filters.tags,
                        },
                        limit: 50,
                    });

                    set({ results: response.data.results || [] });
                } catch (error) {
                    console.error('Search failed:', error);
                    set({ results: [] });
                } finally {
                    set({ isSearching: false });
                }
            },

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
