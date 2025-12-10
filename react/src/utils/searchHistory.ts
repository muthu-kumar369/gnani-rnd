const MAX_HISTORY = 10;
const STORAGE_KEY = 'gnani_search_history';

export class SearchHistory {
    private history: string[] = [];

    constructor() {
        this.loadHistory();
    }

    add(query: string): void {
        if (!query || !query.trim()) return;

        // Remove if exists (to move to top)
        this.history = this.history.filter(q => q.toLowerCase() !== query.toLowerCase());

        // Add to front
        this.history.unshift(query.trim());

        // Limit size
        if (this.history.length > MAX_HISTORY) {
            this.history = this.history.slice(0, MAX_HISTORY);
        }

        this.saveHistory();
    }

    getHistory(): string[] {
        return this.history;
    }

    clear(): void {
        this.history = [];
        this.saveHistory();
    }

    remove(query: string): void {
        this.history = this.history.filter(q => q !== query);
        this.saveHistory();
    }

    private loadHistory(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.history = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load search history', e);
            this.history = [];
        }
    }

    private saveHistory(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
        } catch (e) {
            console.error('Failed to save search history', e);
        }
    }
}

export const searchHistory = new SearchHistory();
