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

interface DeviceResponse {
    deviceId: string;
    deviceName: string;
    deviceType: string;
    lastActive: string;
    isActive: boolean;
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

interface HistoryResponse {
    _id: string;
    action: string;
    timestamp: string;
    details: Record<string, any>;
}

interface MessageResponse {
    message: string;
}

interface DevicesMessageResponse extends MessageResponse {
    devices: DeviceResponse[];
}

interface OAuthMessageResponse extends MessageResponse {
    providers: OAuthProviderResponse[];
}

interface HistoryMessageResponse extends MessageResponse {
    history?: HistoryResponse[];
}

interface NotesMessageResponse extends MessageResponse {
    notes: string[];
}

// Profile API
export const userService = {
    // Profile Management
    async getProfile(): Promise<ProfileResponse> {
        return apiClient.get<ProfileResponse>('/user/profile');
    },

    async updateProfile(profileData: Partial<IProfile>): Promise<UpdateProfileResponse> {
        return apiClient.put<UpdateProfileResponse>('/user/profile', profileData);
    },

    // Settings Management
    async getSettings(): Promise<SettingsResponse> {
        return apiClient.get<SettingsResponse>('/user/settings');
    },

    async updateSettings(settingsData: { settings?: Partial<ISettings>; preferences?: Record<string, any> }): Promise<UpdateSettingsResponse> {
        return apiClient.put<UpdateSettingsResponse>('/user/settings', settingsData);
    },

    // Device Management
    async getDevices(): Promise<DeviceResponse[]> {
        return apiClient.get<DeviceResponse[]>('/user/devices');
    },

    async addDevice(deviceData: { deviceId: string; deviceName: string; deviceType: string }): Promise<DevicesMessageResponse> {
        return apiClient.post<DevicesMessageResponse>('/user/devices', deviceData);
    },

    async updateDevice(deviceId: string, deviceData: { deviceName?: string; deviceType?: string; isActive?: boolean }): Promise<DevicesMessageResponse> {
        return apiClient.put<DevicesMessageResponse>(`/user/devices/${deviceId}`, deviceData);
    },

    async removeDevice(deviceId: string): Promise<DevicesMessageResponse> {
        return apiClient.delete<DevicesMessageResponse>(`/user/devices/${deviceId}`);
    },

    // Security Management
    async getSecurity(): Promise<SecurityResponse> {
        return apiClient.get<SecurityResponse>('/user/security');
    },

    async updateSecurity(securityData: { mfaEnabled?: boolean; recoveryEmail?: string }): Promise<UpdateSecurityResponse> {
        return apiClient.put<UpdateSecurityResponse>('/user/security', securityData);
    },

    // OAuth Provider Management
    async getOAuthProviders(): Promise<OAuthProviderResponse[]> {
        return apiClient.get<OAuthProviderResponse[]>('/user/oauth');
    },

    async unlinkOAuthProvider(provider: string): Promise<OAuthMessageResponse> {
        return apiClient.delete<OAuthMessageResponse>(`/user/oauth/${provider}`);
    },

    // History Management
    async getHistory(): Promise<HistoryResponse[]> {
        return apiClient.get<HistoryResponse[]>('/user/history');
    },

    async deleteHistoryItem(id: string): Promise<HistoryMessageResponse> {
        return apiClient.delete<HistoryMessageResponse>(`/user/history/${id}`);
    },

    async clearHistory(): Promise<MessageResponse> {
        return apiClient.delete<MessageResponse>('/user/history');
    },

    // Notes Management
    async getNotes(): Promise<string[]> {
        return apiClient.get<string[]>('/user/notes');
    },

    async addNote(note: string): Promise<NotesMessageResponse> {
        return apiClient.post<NotesMessageResponse>('/user/notes', { note });
    },

    async deleteNote(index: number): Promise<NotesMessageResponse> {
        return apiClient.delete<NotesMessageResponse>(`/user/notes/${index}`);
    }
};
