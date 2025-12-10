import axios, { AxiosError } from 'axios';
import type { AxiosResponse } from 'axios';
import { parseError } from '../utils/errorParser';
import { useRateLimitStore } from '../store/useRateLimitStore';
import { useErrorStore } from '../store/useErrorStore';

// Create axios instance with interceptors
const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add auth token if available
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response: AxiosResponse) => {
        // STAGE 19: Parse and store rate limit headers
        if (response.headers) {
            useRateLimitStore.getState().updateRateLimit(response.headers as any);
        }
        return response;
    },
    (error: AxiosError) => {
        // STAGE 19: Parse rate limit headers even on error
        if (error.response?.headers) {
            useRateLimitStore.getState().updateRateLimit(error.response.headers as any);
        }

        // Get user-friendly error message
        const parsedError = parseError(error);

        // Add to error store for display
        const { addError } = useErrorStore.getState();
        addError(parsedError);

        // Log to console in development
        if (import.meta.env.DEV) {
            console.error('API Error:', {
                url: error.config?.url,
                method: error.config?.method,
                status: error.response?.status,
                message: error.message,
                parsedError,
            });
        }

        // Handle specific error cases
        if (error.response?.status === 401) {
            // Redirect to login on unauthorized
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default api;
