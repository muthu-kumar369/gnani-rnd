import errorLogger from '../utils/errorLogger';

const API_BASE_URL = 'http://localhost:3000/api/v1';

interface ApiError {
    error: string;
    message: string;
}

class ApiClient {
    private getAuthToken(): string | null {
        // Get token from AuthContext via localStorage or session storage
        // This will be injected by the auth system
        return localStorage.getItem('accessToken');
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

        return response.json();
    }

    async get<T>(endpoint: string): Promise<T> {
        const token = this.getAuthToken();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'x-auth-token': token })
            }
        });

        return this.handleResponse<T>(response);
    }

    async post<T>(endpoint: string, data?: any): Promise<T> {
        const token = this.getAuthToken();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'x-auth-token': token })
            },
            body: data ? JSON.stringify(data) : undefined
        });

        return this.handleResponse<T>(response);
    }

    async patch<T>(endpoint: string, data?: any): Promise<T> {
        const token = this.getAuthToken();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'x-auth-token': token })
            },
            body: data ? JSON.stringify(data) : undefined
        });

        return this.handleResponse<T>(response);
    }

    async put<T>(endpoint: string, data: any): Promise<T> {
        const token = this.getAuthToken();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'x-auth-token': token })
            },
            body: JSON.stringify(data)
        });

        return this.handleResponse<T>(response);
    }

    async delete<T>(endpoint: string): Promise<T> {
        const token = this.getAuthToken();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'x-auth-token': token })
            }
        });

        return this.handleResponse<T>(response);
    }
}

export const apiClient = new ApiClient();
