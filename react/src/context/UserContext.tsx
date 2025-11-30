import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userService } from '../api/userService';
import { oauthService } from '../api/oauthService';
import type { User, IProfile, ISettings, ISecurity } from '../types/user';
import errorLogger from '../utils/errorLogger';
import { useAuth } from './AuthContext';

interface UserContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    refreshUser: () => Promise<void>;
    updateProfile: (data: Partial<IProfile>) => Promise<void>;
    updateSettings: (data: Partial<ISettings>) => Promise<void>;
    removeDevice: (deviceId: string) => Promise<void>;
    updateSecurity: (data: Partial<ISecurity>) => Promise<void>;
    linkOAuthProvider: (provider: string) => Promise<void>;
    unlinkOAuthProvider: (provider: string) => Promise<void>;
    clearHistory: () => Promise<void>;
    deleteHistoryItem: (id: string) => Promise<void>;
    addNote: (note: string) => Promise<void>;
    deleteNote: (index: number) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, logout } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshUser = useCallback(async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Fetch all user data in parallel
            const [profileData, settingsData, devices, security, oauthProviders, history, notes] = await Promise.all([
                userService.getProfile(),
                userService.getSettings(),
                userService.getDevices(),
                userService.getSecurity(),
                userService.getOAuthProviders(),
                userService.getHistory(),
                userService.getNotes()
            ]);

            const userData: User = {
                id: profileData.userId,
                email: profileData.email,
                profile: profileData.profile,
                settings: settingsData.settings,
                devices: devices.map(d => ({
                    deviceId: d.deviceId,
                    deviceName: d.deviceName,
                    deviceType: d.deviceType as 'desktop' | 'mobile' | 'web' | 'speaker',
                    lastActive: d.lastActive,
                    isTrusted: d.isActive
                })),
                security: {
                    failedLoginAttempts: 0,
                    mfaEnabled: security.mfaEnabled,
                    recoveryEmail: security.recoveryEmail,
                    activeSessions: 1
                },
                oauthProviders: oauthProviders.map(o => ({
                    provider: o.provider,
                    providerUserId: o.providerId,
                    linkedAt: o.linkedAt
                })),
                history: history.map(h => ({
                    id: h._id,
                    query: h.action,
                    response: JSON.stringify(h.details),
                    timestamp: h.timestamp
                })),
                notes,
                roles: profileData.roles,
                permissions: profileData.permissions,
                preferences: profileData.preferences || settingsData.preferences,
                metadata: {
                    lastLogin: profileData.lastLoginAt,
                    accountCreated: profileData.createdAt,
                    accountType: 'free'
                },
                isOnboarded: profileData.isOnboarded,
                isActive: profileData.isActive,
                lastLoginAt: profileData.lastLoginAt,
                createdAt: profileData.createdAt,
                updatedAt: profileData.updatedAt
            };

            setUser(userData);
            setError(null);
            setLoading(false);
        } catch (err: any) {
            errorLogger.error('Failed to fetch user data', err, { context: 'UserContext' });
            if (err.status === 401) {
                logout();
                // Don't set loading to false here; keep it true until the redirect happens
            } else {
                setError('Failed to load user profile');
                setLoading(false);
            }
        }
    }, [isAuthenticated, logout]);

    useEffect(() => {
        if (isAuthenticated) {
            refreshUser();
        } else {
            setUser(null);
            setLoading(false);
        }
    }, [isAuthenticated, refreshUser]);

    const updateSettings = useCallback(async (newSettings: Partial<ISettings>) => {
        if (!user) return;

        // Optimistic update
        const previousSettings = user.settings;
        setUser(prev => prev ? {
            ...prev,
            settings: { ...prev.settings, ...newSettings }
        } : null);

        try {
            await userService.updateSettings({ settings: newSettings });
            errorLogger.info('Settings updated', { context: 'UserContext', settings: newSettings });
        } catch (err) {
            // Revert on error
            setUser(prev => prev ? {
                ...prev,
                settings: previousSettings
            } : null);
            errorLogger.error('Failed to update settings', err, { context: 'UserContext' });
            throw err;
        }
    }, [user]);

    const updateProfile = useCallback(async (newProfile: Partial<IProfile>) => {
        if (!user) return;

        // Optimistic update
        const previousProfile = user.profile;
        setUser(prev => prev ? {
            ...prev,
            profile: { ...prev.profile, ...newProfile }
        } : null);

        try {
            await userService.updateProfile(newProfile);
            errorLogger.info('Profile updated', { context: 'UserContext', profile: newProfile });
        } catch (err) {
            // Revert on error
            setUser(prev => prev ? {
                ...prev,
                profile: previousProfile
            } : null);
            errorLogger.error('Failed to update profile', err, { context: 'UserContext' });
            throw err;
        }
    }, [user]);

    const removeDevice = useCallback(async (deviceId: string) => {
        if (!user) return;

        // Optimistic update
        const previousDevices = user.devices;
        setUser(prev => prev ? {
            ...prev,
            devices: prev.devices.filter(d => d.deviceId !== deviceId)
        } : null);

        try {
            await userService.removeDevice(deviceId);
            errorLogger.info('Device removed', { context: 'UserContext', deviceId });
        } catch (err) {
            // Revert on error
            setUser(prev => prev ? {
                ...prev,
                devices: previousDevices
            } : null);
            errorLogger.error('Failed to remove device', err, { context: 'UserContext' });
            throw err;
        }
    }, [user]);

    const updateSecurity = useCallback(async (securityData: { mfaEnabled?: boolean; recoveryEmail?: string }) => {
        if (!user) return;

        // Optimistic update
        const previousSecurity = user.security;
        setUser(prev => prev ? {
            ...prev,
            security: { ...prev.security, ...securityData }
        } : null);

        try {
            await userService.updateSecurity(securityData);
            errorLogger.info('Security updated', { context: 'UserContext', security: securityData });
        } catch (err) {
            // Revert on error
            setUser(prev => prev ? {
                ...prev,
                security: previousSecurity
            } : null);
            errorLogger.error('Failed to update security', err, { context: 'UserContext' });
            throw err;
        }
    }, [user]);

    const linkOAuthProvider = useCallback(async (provider: string) => {
        if (!user) return;

        // We don't do optimistic updates for linking because it involves an external flow
        // and we need the result to know what to add.
        // The refreshUser() call after successful linking will update the state.

        try {
            // Static import usage
            await oauthService.initiateOAuth(provider);
            await refreshUser();
            errorLogger.info('OAuth provider linked', { context: 'UserContext', provider });
        } catch (err) {
            errorLogger.error('Failed to link OAuth provider', err, { context: 'UserContext' });
            throw err;
        }
    }, [user, refreshUser]);

    const unlinkOAuthProvider = useCallback(async (provider: string) => {
        if (!user) return;

        // Optimistic update
        const previousProviders = user.oauthProviders;
        setUser(prev => prev ? {
            ...prev,
            oauthProviders: prev.oauthProviders.filter(p => p.provider !== provider)
        } : null);

        try {
            await userService.unlinkOAuthProvider(provider);
            errorLogger.info('OAuth provider unlinked', { context: 'UserContext', provider });
        } catch (err) {
            // Revert on error
            setUser(prev => prev ? {
                ...prev,
                oauthProviders: previousProviders
            } : null);
            errorLogger.error('Failed to unlink OAuth provider', err, { context: 'UserContext' });
            throw err;
        }
    }, [user]);

    const deleteHistoryItem = useCallback(async (id: string) => {
        if (!user) return;

        // Optimistic update
        const previousHistory = user.history;
        setUser(prev => prev ? {
            ...prev,
            history: prev.history.filter(h => h.id !== id)
        } : null);

        try {
            await userService.deleteHistoryItem(id);
            errorLogger.info('History item deleted', { context: 'UserContext', id });
        } catch (err) {
            // Revert on error
            setUser(prev => prev ? {
                ...prev,
                history: previousHistory
            } : null);
            errorLogger.error('Failed to delete history item', err, { context: 'UserContext' });
            throw err;
        }
    }, [user]);

    const clearHistory = useCallback(async () => {
        if (!user) return;

        // Optimistic update
        const previousHistory = user.history;
        setUser(prev => prev ? {
            ...prev,
            history: []
        } : null);

        try {
            await userService.clearHistory();
            errorLogger.info('History cleared', { context: 'UserContext' });
        } catch (err) {
            // Revert on error
            setUser(prev => prev ? {
                ...prev,
                history: previousHistory
            } : null);
            errorLogger.error('Failed to clear history', err, { context: 'UserContext' });
            throw err;
        }
    }, [user]);

    const addNote = useCallback(async (note: string) => {
        if (!user) return;

        // Optimistic update
        const previousNotes = user.notes;
        setUser(prev => prev ? {
            ...prev,
            notes: [...prev.notes, note]
        } : null);

        try {
            await userService.addNote(note);
            errorLogger.info('Note added', { context: 'UserContext', note });
        } catch (err) {
            // Revert on error
            setUser(prev => prev ? {
                ...prev,
                notes: previousNotes
            } : null);
            errorLogger.error('Failed to add note', err, { context: 'UserContext' });
            throw err;
        }
    }, [user]);

    const deleteNote = useCallback(async (index: number) => {
        if (!user) return;

        // Optimistic update
        const previousNotes = user.notes;
        setUser(prev => prev ? {
            ...prev,
            notes: prev.notes.filter((_, i) => i !== index)
        } : null);

        try {
            await userService.deleteNote(index);
            errorLogger.info('Note deleted', { context: 'UserContext', index });
        } catch (err) {
            // Revert on error
            setUser(prev => prev ? {
                ...prev,
                notes: previousNotes
            } : null);
            errorLogger.error('Failed to delete note', err, { context: 'UserContext' });
            throw err;
        }
    }, [user]);

    return (
        <UserContext.Provider value={{
            user,
            loading,
            error,
            updateSettings,
            updateProfile,
            refreshUser,
            removeDevice,
            updateSecurity,
            linkOAuthProvider,
            unlinkOAuthProvider,
            deleteHistoryItem,
            clearHistory,
            addNote,
            deleteNote
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
