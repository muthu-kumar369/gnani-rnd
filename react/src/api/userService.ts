import { apiClient } from './apiClient';
import type { IProfile, ISettings } from '../types/user';

// Response types based on API documentation
interface ProfileResponse {
    userId: string;
    username: string;
    email: string;
    roles: string[];
    permissions: string[];
    profile: IProfile;
    preferences: Record<string, any>;
    isActive: boolean;
    isOnboarded: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string;
}

interface UpdateProfileResponse {
    message: string;
    profile: IProfile;
}

interface SettingsResponse {
    settings: ISettings;
    preferences: Record<string, any>;
}

interface UpdateSettingsResponse {
    message: string;
    settings: ISettings;
}



interface SecurityResponse {
    mfaEnabled: boolean;
    recoveryEmail?: string;
    lastPasswordChange?: string;
}

interface UpdateSecurityResponse {
    message: string;
    security: {
        mfaEnabled: boolean;
        recoveryEmail?: string;
    };
}

interface OAuthProviderResponse {
    provider: string;
    providerId: string;
    email: string;
    linkedAt: string;
}



interface MessageResponse {
    message: string;
}



interface OAuthMessageResponse extends MessageResponse {
    providers: OAuthProviderResponse[];
}



interface NotesMessageResponse extends MessageResponse {
    notes: string[];
}

// Profile API
export const userService = {
    // Profile Management
    async getProfile(): Promise<ProfileResponse> {
        try {
            return await import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
                apiClient.get<ProfileResponse>('/user/profile')
            ));
        } catch (error) {
            const { DEFAULT_PROFILE, isCircuitOpenError } = await import('../utils/fallbacks');
            if (isCircuitOpenError(error)) {
                return DEFAULT_PROFILE;
            }
            throw error;
        }
    },

    async updateProfile(profileData: Partial<IProfile>): Promise<UpdateProfileResponse> {
        return import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
            apiClient.put<UpdateProfileResponse>('/user/profile', profileData)
        ));
    },

    // Settings Management
    async getSettings(): Promise<SettingsResponse> {
        try {
            return await import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
                apiClient.get<SettingsResponse>('/user/settings')
            ));
        } catch (error) {
            const { DEFAULT_SETTINGS, isCircuitOpenError } = await import('../utils/fallbacks');
            if (isCircuitOpenError(error)) {
                return DEFAULT_SETTINGS;
            }
            throw error;
        }
    },

    async updateSettings(settingsData: { settings?: Partial<ISettings>; preferences?: Record<string, any> }): Promise<UpdateSettingsResponse> {
        return import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
            apiClient.put<UpdateSettingsResponse>('/user/settings', settingsData)
        ));
    },



    // Security Management
    async getSecurity(): Promise<SecurityResponse> {
        return import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
            apiClient.get<SecurityResponse>('/user/security')
        ));
    },

    async updateSecurity(securityData: { mfaEnabled?: boolean; recoveryEmail?: string }): Promise<UpdateSecurityResponse> {
        return import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
            apiClient.put<UpdateSecurityResponse>('/user/security', securityData)
        ));
    },

    // OAuth Provider Management
    async getOAuthProviders(): Promise<OAuthProviderResponse[]> {
        return import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
            apiClient.get<OAuthProviderResponse[]>('/user/oauth')
        ));
    },

    async unlinkOAuthProvider(provider: string): Promise<OAuthMessageResponse> {
        return import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
            apiClient.delete<OAuthMessageResponse>(`/user/oauth/${provider}`)
        ));
    },



    // Notes Management
    async getNotes(): Promise<string[]> {
        try {
            return await import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
                apiClient.get<string[]>('/user/notes')
            ));
        } catch (error) {
            const { isCircuitOpenError } = await import('../utils/fallbacks');
            if (isCircuitOpenError(error)) return [];
            throw error;
        }
    },

    async addNote(note: string): Promise<NotesMessageResponse> {
        return import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
            apiClient.post<NotesMessageResponse>('/user/notes', { note })
        ));
    },

    async deleteNote(index: number): Promise<NotesMessageResponse> {
        return import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
            apiClient.delete<NotesMessageResponse>(`/user/notes/${index}`)
        ));
    },

    // File Management
    async uploadFile(file: File): Promise<{ success: boolean; file: { id: string; url: string } }> {
        const formData = new FormData();
        formData.append('file', file);
        return import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
            apiClient.post<{ success: boolean; file: { id: string; url: string } }>('/files/upload', formData)
        ));
    }
};
