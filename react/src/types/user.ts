export interface ISettings {
    wakeWord: string;
    preferredVoice: string;
    volume: number;
    theme: 'dark' | 'light' | 'system' | 'jarvis';
    shortcuts: Record<string, string>; // Using Record instead of Map for easier JSON serialization
    speechSpeed: number; // Frontend only requirement
}

export interface IProfile {
    firstName: string;
    lastName: string;
    dob: string; // ISO date string
    locale: string;
    language: string;
    profilePhoto?: string;
}

export interface IDevice {
    deviceId: string;
    deviceName: string;
    deviceType: 'desktop' | 'mobile' | 'web' | 'speaker';
    lastActive: string; // ISO date string
    isTrusted: boolean;
}

export interface IHistoryItem {
    id: string;
    query: string;
    response: string;
    timestamp: string; // ISO date string
    deviceId?: string;
}

export interface ISecurity {
    failedLoginAttempts: number;
    lastFailedLogin?: string; // ISO date string
    mfaEnabled: boolean;
    recoveryEmail?: string;
    activeSessions: number;
}

export interface IOAuthProvider {
    provider: string;
    providerUserId: string;
    linkedAt: string; // ISO date string
}

export interface User {
    id: string;
    email: string;
    profile: IProfile;
    settings: ISettings;
    devices: IDevice[];
    history: IHistoryItem[];
    security: ISecurity;
    oauthProviders: IOAuthProvider[];
    notes: string[];
    roles: string[];
    permissions: string[];
    preferences: Record<string, any>;
    metadata: Record<string, any>;
    isOnboarded: boolean;
    isActive: boolean;
    lastLoginAt: string;
    createdAt: string;
    updatedAt: string;
}
