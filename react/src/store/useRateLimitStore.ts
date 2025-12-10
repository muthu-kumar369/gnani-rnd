import { create } from 'zustand';

interface RateLimitState {
    limit: number;
    remaining: number;
    resetAt: number;
    updateRateLimit: (headers: Headers) => void;
}

const parseRateLimitHeaders = (headers: Headers) => {
    return {
        limit: parseInt(headers.get('X-RateLimit-Limit') || '0'),
        remaining: parseInt(headers.get('X-RateLimit-Remaining') || '0'),
        resetAt: parseInt(headers.get('X-RateLimit-Reset') || '0'),
    };
};

export const useRateLimitStore = create<RateLimitState>((set) => ({
    limit: 0,
    remaining: 0,
    resetAt: 0,
    updateRateLimit: (headers: Headers) => {
        const rateLimit = parseRateLimitHeaders(headers);
        set(rateLimit);
    },
}));
