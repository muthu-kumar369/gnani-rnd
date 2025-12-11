// STAGE 1: Enhanced API client with retry logic
import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { parseError } from '../utils/errorParser';
import { useRateLimitStore } from '../store/useRateLimitStore';
import { useErrorStore } from '../store/useErrorStore';
import config from '../config/app.config'; // STAGE 1: Use centralized config

// Retry configuration
interface RetryConfig {
    retries: number;
    retryDelay: number;
    retryCondition?: (error: AxiosError) => boolean;
}

const defaultRetryConfig: RetryConfig = {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error: AxiosError) => {
        // Retry on network errors or 5xx server errors
        if (!error.response) return true; // Network error
        const status = error.response.status;
        return status >= 500 && status < 600;
    }
};

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

function getRequestKey(config: AxiosRequestConfig): string {
    return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
}

// Create axios instance with interceptors
const api: AxiosInstance = axios.create({
    baseURL: config.apiUrl, // STAGE 1: Use centralized config
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

        if (import.meta.env.DEV) {
            console.log(`[API Client] Request: ${config.method?.toUpperCase()} ${config.url}`, {
                token: !!token,
                deduplication: config.method === 'get'
            });
        }

        // STAGE 1: Request deduplication logic removed from interceptor
        // It is now handled exclusively by the api.get wrapper to avoid circular dependencies (request waiting for itself)

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling and retry logic
api.interceptors.response.use(
    (response: AxiosResponse) => {
        // STAGE 19: Parse and store rate limit headers
        if (response.headers) {
            useRateLimitStore.getState().updateRateLimit(response.headers as any);
        }

        // Clean up deduplication cache - REMOVED (Handled by wrapper)

        return response;
    },
    async (error: AxiosError) => {
        // Handle deduplicated requests - REMOVED

        const config = error.config as AxiosRequestConfig & { __retryCount?: number };

        // STAGE 19: Parse rate limit headers even on error
        if (error.response?.headers) {
            useRateLimitStore.getState().updateRateLimit(error.response.headers as any);
        }

        // STAGE 1: Retry logic with exponential backoff
        const retryCount = config.__retryCount || 0;
        const shouldRetry = defaultRetryConfig.retryCondition?.(error) && retryCount < defaultRetryConfig.retries;

        if (shouldRetry && config) {
            config.__retryCount = retryCount + 1;

            // Exponential backoff: 1s, 2s, 4s
            const delay = defaultRetryConfig.retryDelay * Math.pow(2, retryCount);

            console.warn(`[API Client] Retry ${retryCount + 1}/${defaultRetryConfig.retries} after ${delay}ms`, {
                url: config.url,
                error: error.message
            });

            await new Promise(resolve => setTimeout(resolve, delay));
            return api.request(config);
        }

        // Clean up deduplication cache on error - REMOVED (Handled by wrapper)

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
                retryCount
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

// Wrapper to handle deduplication for GET requests
const originalGet = api.get.bind(api);
api.get = function <T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R> {
    const key = getRequestKey({ method: 'get', url, ...config });

    if (pendingRequests.has(key)) {
        console.log('[API Client] Using cached pending request:', key);
        return pendingRequests.get(key)! as Promise<R>;
    }

    const request = originalGet<T, R, D>(url, config).finally(() => {
        // console.log('[API Client] Request finished (success/fail), clearing cache:', key);
        pendingRequests.delete(key);
    });

    pendingRequests.set(key, request as any);
    // console.log('[API Client] New GET request started:', key);
    return request;
};

export default api;
