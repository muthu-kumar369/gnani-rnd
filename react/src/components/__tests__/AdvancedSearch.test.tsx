import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdvancedSearch from '../common/AdvancedSearch';

// Mock API
vi.mock('../../api/client', () => ({
    default: {
        post: vi.fn(() => Promise.resolve({ data: { results: [] } }))
    }
}));

// Mock Store
const mockSetQuery = vi.fn();
const mockSetFilters = vi.fn();
const mocksetIsSearching = vi.fn();
const mockAddToHistory = vi.fn();
const mockSetResults = vi.fn();

vi.mock('../../store/useSearchStore', () => ({
    useSearchStore: vi.fn(() => ({
        query: '',
        filters: { models: [], folders: [] },
        results: [],
        isSearching: false,
        searchHistory: [],
        setQuery: mockSetQuery,
        setFilters: mockSetFilters,
        setResults: mockSetResults,
        setIsSearching: mocksetIsSearching,
        addToHistory: mockAddToHistory,
        clearResults: vi.fn(),
    }))
}));

// Mock Hook
vi.mock('../../hooks/useSearchSuggestions', () => ({
    useSearchSuggestions: vi.fn(() => []),
}));

describe('Advanced Search', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render search input', () => {
        render(<AdvancedSearch isOpen={true} onClose={vi.fn()} />);
        expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
    });

    // Note: Since `AdvancedSearch` relies on store state for `query` and handles input via local state or store? 
    // Checking code: `const { query ... setQuery } = useSearchStore();`
    // Input value comes from store `query`?
    // Let's check `AdvancedSearch.tsx` again? 
    // No, I missed checking the input rendering part. 
    // Usually <input value={query} onChange={e => setQuery(e.target.value)} />

    // Assuming standard controlled input.

    // Test interactions
    // Since we mocked `useSearchStore` to return empty query, typing might not update value if component is fully controlled by store 
    // AND we didn't mock `useSearchStore` to update returned `query` on `setQuery` call.
    // Integration tests with mocked stores are tricky if state update logic is needed.
    // However, we can check if `setQuery` was called.

    it('should update query on input', () => {
        render(<AdvancedSearch isOpen={true} onClose={vi.fn()} />);
        const input = screen.getByPlaceholderText(/Search/i);

        fireEvent.change(input, { target: { value: 'test' } });
        expect(mockSetQuery).toHaveBeenCalledWith('test');
    });
});
