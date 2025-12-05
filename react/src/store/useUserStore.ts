import { create } from 'zustand';
import { userService } from '../api/userService';
import { oauthService } from '../api/oauthService';
import type { User, IProfile, ISettings, ISecurity } from '../types/user';
import errorLogger from '../utils/errorLogger';

interface UserStore {
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
  error: string | null;
  isAuthenticated: boolean;
  accessToken: string | null;

  // Actions
  setAuth: (isAuthenticated: boolean, accessToken: string | null) => void;
  logout: () => void;

  // Login helpers
  loginStart: () => void;
  loginSuccess: (user: User, accessToken: string, refreshToken: string) => void;
  loginFailure: (error: string) => void;

  refreshUser: () => Promise<void>;
  initialize: () => void;
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

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  loading: true,
  isInitialized: false,
  error: null,
  isAuthenticated: false,
  accessToken: null,

  // Initialize the store - check if user is authenticated
  initialize: () => {
    // Ensure loading screen shows for at least 1 second for better UX
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1000));

    // Try to load token from localStorage
    const storedToken = localStorage.getItem('accessToken');

    if (!storedToken) {
      // No token found, user needs to login
      minLoadingTime.then(() => {
        set({ loading: false, isAuthenticated: false, accessToken: null, isInitialized: true });
      });
    } else {
      // Token found, set it and try to refresh user data
      set({ accessToken: storedToken, isAuthenticated: true, loading: true });
      Promise.all([get().refreshUser(), minLoadingTime])
        .then(() => {
          set({ isInitialized: true });
        })
        .catch(() => {
          // If refresh fails (expired token), logout and show login
          get().logout();
          set({ isInitialized: true });
        });
    }
  },

  setAuth: (isAuthenticated, accessToken) => {
    // Save token to localStorage for API client
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    } else {
      localStorage.removeItem('accessToken');
    }
    set({ isAuthenticated, accessToken });
  },

  logout: () => {
    // Clear token from localStorage
    localStorage.removeItem('accessToken');

    set({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      error: null,
      loading: false
    });
  },

  loginStart: () => set({ loading: true, error: null }),

  loginSuccess: (user, accessToken, _refreshToken) => {
    // Note: Refresh token should ideally be handled by an HttpOnly cookie or secure storage mechanism
    // For now we just update the store state
    set({
      isAuthenticated: true,
      user,
      accessToken,
      loading: false,
      error: null
    });
  },

  loginFailure: (error) => set({
    loading: false,
    error,
    isAuthenticated: false,
    user: null,
    accessToken: null
  }),

  refreshUser: async () => {
    const { isAuthenticated, logout } = get();
    if (!isAuthenticated) {
      set({ loading: false });
      return;
    }

    set({ loading: true });
    try {
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

      set({ user: userData, error: null, loading: false });
    } catch (err: any) {
      errorLogger.error('Failed to fetch user data', err, { context: 'useUserStore' });

      // Check if token is expired or invalid
      const isTokenError = err.status === 401 ||
        err?.response?.status === 401 ||
        err?.message?.toLowerCase().includes('expired') ||
        err?.message?.toLowerCase().includes('not valid') ||
        err?.message?.toLowerCase().includes('invalid');

      if (isTokenError) {
        errorLogger.info('Token expired or invalid, logging out user', { context: 'useUserStore' });
        logout();
      } else {
        set({ error: 'Failed to load user profile', loading: false });
      }
    }
  },

  updateSettings: async (newSettings) => {
    const { user } = get();
    if (!user) return;

    const previousSettings = user.settings;
    set({
      user: { ...user, settings: { ...user.settings, ...newSettings } }
    });

    try {
      await userService.updateSettings({ settings: newSettings });
      errorLogger.info('Settings updated', { context: 'useUserStore', settings: newSettings });
    } catch (err) {
      set({ user: { ...user, settings: previousSettings } });
      errorLogger.error('Failed to update settings', err as Error, { context: 'useUserStore' });
      throw err;
    }
  },

  updateProfile: async (newProfile) => {
    const { user } = get();
    if (!user) return;

    const previousProfile = user.profile;
    set({
      user: { ...user, profile: { ...user.profile, ...newProfile } }
    });

    try {
      await userService.updateProfile(newProfile);
      errorLogger.info('Profile updated', { context: 'useUserStore', profile: newProfile });
    } catch (err) {
      set({ user: { ...user, profile: previousProfile } });
      errorLogger.error('Failed to update profile', err as Error, { context: 'useUserStore' });
      throw err;
    }
  },

  removeDevice: async (deviceId) => {
    const { user } = get();
    if (!user) return;

    const previousDevices = user.devices;
    set({
      user: { ...user, devices: user.devices.filter(d => d.deviceId !== deviceId) }
    });

    try {
      await userService.removeDevice(deviceId);
      errorLogger.info('Device removed', { context: 'useUserStore', deviceId });
    } catch (err) {
      set({ user: { ...user, devices: previousDevices } });
      errorLogger.error('Failed to remove device', err as Error, { context: 'useUserStore' });
      throw err;
    }
  },

  updateSecurity: async (securityData) => {
    const { user } = get();
    if (!user) return;

    const previousSecurity = user.security;
    set({
      user: { ...user, security: { ...user.security, ...securityData } }
    });

    try {
      await userService.updateSecurity(securityData);
      errorLogger.info('Security updated', { context: 'useUserStore', security: securityData });
    } catch (err) {
      set({ user: { ...user, security: previousSecurity } });
      errorLogger.error('Failed to update security', err as Error, { context: 'useUserStore' });
      throw err;
    }
  },

  linkOAuthProvider: async (provider) => {
    // No optimistic update for linking
    try {
      await oauthService.initiateOAuth(provider);
      await get().refreshUser();
      errorLogger.info('OAuth provider linked', { context: 'useUserStore', provider });
    } catch (err) {
      errorLogger.error('Failed to link OAuth provider', err as Error, { context: 'useUserStore' });
      throw err;
    }
  },

  unlinkOAuthProvider: async (provider) => {
    const { user } = get();
    if (!user) return;

    const previousProviders = user.oauthProviders;
    set({
      user: { ...user, oauthProviders: user.oauthProviders.filter(p => p.provider !== provider) }
    });

    try {
      await userService.unlinkOAuthProvider(provider);
      errorLogger.info('OAuth provider unlinked', { context: 'useUserStore', provider });
    } catch (err) {
      set({ user: { ...user, oauthProviders: previousProviders } });
      errorLogger.error('Failed to unlink OAuth provider', err as Error, { context: 'useUserStore' });
      throw err;
    }
  },

  clearHistory: async () => {
    const { user } = get();
    if (!user) return;

    const previousHistory = user.history;
    set({
      user: { ...user, history: [] }
    });

    try {
      await userService.clearHistory();
      errorLogger.info('History cleared', { context: 'useUserStore' });
    } catch (err) {
      set({ user: { ...user, history: previousHistory } });
      errorLogger.error('Failed to clear history', err as Error, { context: 'useUserStore' });
      throw err;
    }
  },

  deleteHistoryItem: async (id) => {
    const { user } = get();
    if (!user) return;

    const previousHistory = user.history;
    set({
      user: { ...user, history: user.history.filter(h => h.id !== id) }
    });

    try {
      await userService.deleteHistoryItem(id);
      errorLogger.info('History item deleted', { context: 'useUserStore', id });
    } catch (err) {
      set({ user: { ...user, history: previousHistory } });
      errorLogger.error('Failed to delete history item', err as Error, { context: 'useUserStore' });
      throw err;
    }
  },

  addNote: async (note) => {
    const { user } = get();
    if (!user) return;

    const previousNotes = user.notes;
    set({
      user: { ...user, notes: [...user.notes, note] }
    });

    try {
      await userService.addNote(note);
      errorLogger.info('Note added', { context: 'useUserStore', note });
    } catch (err) {
      set({ user: { ...user, notes: previousNotes } });
      errorLogger.error('Failed to add note', err as Error, { context: 'useUserStore' });
      throw err;
    }
  },

  deleteNote: async (index) => {
    const { user } = get();
    if (!user) return;

    const previousNotes = user.notes;
    set({
      user: { ...user, notes: user.notes.filter((_, i) => i !== index) }
    });

    try {
      await userService.deleteNote(index);
      errorLogger.info('Note deleted', { context: 'useUserStore', index });
    } catch (err) {
      set({ user: { ...user, notes: previousNotes } });
      errorLogger.error('Failed to delete note', err as Error, { context: 'useUserStore' });
      throw err;
    }
  }
}));
