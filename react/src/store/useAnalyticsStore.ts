import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AnalyticsEvent {
    type: string;
    timestamp: number;
    metadata?: Record<string, any>;
}

interface UsageStats {
    totalMessages: number;
    totalConversations: number;
    totalTokens: number;
    lastActive: number;
}

interface AnalyticsState {
    events: AnalyticsEvent[];
    stats: UsageStats;
    trackEvent: (type: string, metadata?: Record<string, any>) => void;
    incrementMessages: () => void;
    incrementConversations: () => void;
    addTokens: (count: number) => void;
    getStats: () => UsageStats;
    clearEvents: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
    persist(
        (set, get) => ({
            events: [],
            stats: {
                totalMessages: 0,
                totalConversations: 0,
                totalTokens: 0,
                lastActive: Date.now(),
            },

            trackEvent: (type: string, metadata?: Record<string, any>) => {
                const event: AnalyticsEvent = {
                    type,
                    timestamp: Date.now(),
                    metadata,
                };

                set((state) => ({
                    events: [...state.events.slice(-99), event], // Keep last 100 events
                    stats: {
                        ...state.stats,
                        lastActive: Date.now(),
                    },
                }));

                // Log in development
                if (import.meta.env.DEV) {
                    console.log('[Analytics]', type, metadata);
                }
            },

            incrementMessages: () => {
                set((state) => ({
                    stats: {
                        ...state.stats,
                        totalMessages: state.stats.totalMessages + 1,
                        lastActive: Date.now(),
                    },
                }));
            },

            incrementConversations: () => {
                set((state) => ({
                    stats: {
                        ...state.stats,
                        totalConversations: state.stats.totalConversations + 1,
                        lastActive: Date.now(),
                    },
                }));
            },

            addTokens: (count: number) => {
                set((state) => ({
                    stats: {
                        ...state.stats,
                        totalTokens: state.stats.totalTokens + count,
                        lastActive: Date.now(),
                    },
                }));
            },

            getStats: () => get().stats,

            clearEvents: () => {
                set({ events: [] });
            },
        }),
        {
            name: 'gnani-analytics',
            partialize: (state) => ({ stats: state.stats }), // Only persist stats, not events
        }
    )
);
