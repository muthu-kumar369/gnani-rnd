import errorLogger from '../utils/errorLogger';

export const API_BASE_URL = 'http://localhost:3000/api/v1';

interface ApiError {
    error: string;
    message: string;
}

class ApiClient {
    private isRefreshing = false;
    private refreshSubscribers: ((token: string) => void)[] = [];

    private getAuthToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    private getRefreshToken(): string | null {
        return localStorage.getItem('refreshToken');
    }

    private onRefreshed(token: string) {
        this.refreshSubscribers.forEach((callback) => callback(token));
        this.refreshSubscribers = [];
    }

    private addRefreshSubscriber(callback: (token: string) => void) {
        this.refreshSubscribers.push(callback);
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorData: ApiError = await response.json().catch(() => ({
                error: 'Unknown Error',
                message: 'An unexpected error occurred'
            }));

            errorLogger.error('API Error', new Error(errorData.message), {
                context: 'ApiClient',
                status: response.status,
                error: errorData
            });

            const error = new Error(errorData.message || `HTTP ${response.status}`);
            (error as any).status = response.status;
            throw error;
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    private async request<T>(method: string, endpoint: string, data?: any, customConfig?: RequestInit, isRetry = false): Promise<T> {
        const token = this.getAuthToken();
        const isFormData = data instanceof FormData;

        const headers: HeadersInit = {
            ...(token && { 'x-auth-token': token }),
            ...customConfig?.headers,
        };

        if (!isFormData && data && method !== 'GET') {
            (headers as any)['Content-Type'] = 'application/json';
        }

        const config: RequestInit = {
            method,
            headers,
            body: isFormData ? data : (data && method !== 'GET' ? JSON.stringify(data) : undefined),
            ...customConfig,
            cache: method === 'GET' ? 'no-store' : undefined
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Handle 401 Unauthorized (Expired Token)
        if (response.status === 401 && !isRetry) {
            if (this.isRefreshing) {
                // Wait for ongoing refresh
                return new Promise((resolve) => {
                    this.addRefreshSubscriber(() => {
                        resolve(this.request<T>(method, endpoint, data, customConfig, true));
                    });
                });
            }

            this.isRefreshing = true;
            const refreshToken = this.getRefreshToken();

            if (refreshToken) {
                try {
                    // Call Refresh Token API directly using fetch to avoid infinite loop
                    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken })
                    });

                    if (refreshResponse.ok) {
                        const { accessToken, refreshToken: newRefreshToken } = await refreshResponse.json();

                        // Update storage
                        localStorage.setItem('accessToken', accessToken);
                        if (newRefreshToken && typeof newRefreshToken !== 'object') {
                            localStorage.setItem('refreshToken', newRefreshToken);
                        } else if (newRefreshToken && newRefreshToken.token) {
                            localStorage.setItem('refreshToken', newRefreshToken.token);
                        }

                        this.isRefreshing = false;
                        this.onRefreshed(accessToken);

                        // Retry original request
                        return this.request<T>(method, endpoint, data, customConfig, true);
                    } else {
                        throw new Error('Refresh failed');
                    }
                } catch (refreshError) {
                    errorLogger.error('Session refresh failed', refreshError as Error, { context: 'ApiClient' });
                    // Logout and clear storage
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    this.isRefreshing = false;
                    this.refreshSubscribers = []; // Clear queue
                    // Optional: Redirect to login or let the app state update via store listener
                    window.dispatchEvent(new Event('auth:logout')); // Dispatch storage event if cross-tab or custom event
                    throw refreshError;
                }
            } else {
                this.isRefreshing = false;
                // No refresh token, let the error propagate (will trigger logout in store)
            }
        }

        return this.handleResponse<T>(response);
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>('GET', endpoint);
    }

    async post<T>(endpoint: string, data?: any, customConfig?: RequestInit): Promise<T> {
        return this.request<T>('POST', endpoint, data, customConfig);
    }

    async patch<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>('PATCH', endpoint, data);
    }

    async put<T>(endpoint: string, data: any): Promise<T> {
        return this.request<T>('PUT', endpoint, data);
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>('DELETE', endpoint);
    }
}

export const apiClient = new ApiClient();
