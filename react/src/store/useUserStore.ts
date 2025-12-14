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
  updateSettings: (data: { settings?: Partial<ISettings>; preferences?: Record<string, any> } | Partial<ISettings>) => Promise<void>;
  updateSecurity: (data: Partial<ISecurity>) => Promise<void>;
  terminateSessions: () => Promise<void>;
  linkOAuthProvider: (provider: string) => Promise<void>;
  unlinkOAuthProvider: (provider: string) => Promise<void>;

  addNote: (note: string) => Promise<void>;
  deleteNote: (index: number) => Promise<void>;
  uploadProfilePhoto: (file: File) => Promise<void>;
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
    localStorage.removeItem('refreshToken');

    set({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      error: null,
      loading: false
    });
  },

  loginStart: () => set({ loading: true, error: null }),

  loginSuccess: (user, accessToken, refreshToken) => {
    // Save tokens to localStorage
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }

    // Save refresh token
    if (refreshToken) {
      const tokenString = typeof refreshToken === 'object' && 'token' in refreshToken
        ? (refreshToken as any).token
        : refreshToken;

      if (typeof tokenString === 'string') {
        localStorage.setItem('refreshToken', tokenString);
      }
    }

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

      const [profileData, settingsData, security, oauthProviders, notes] = await Promise.all([
        userService.getProfile(),
        userService.getSettings(),
        userService.getSecurity(),
        userService.getOAuthProviders(),
        userService.getNotes()
      ]);

      const userData: User = {
        id: profileData.userId,
        email: profileData.email,
        profile: profileData.profile,
        settings: settingsData.settings,
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

  updateSettings: async (data: { settings?: Partial<ISettings>; preferences?: Record<string, any> } | Partial<ISettings>) => {
    const { user } = get();
    if (!user) return;

    // Normalize input: if specifically wrapped or just settings object
    const payload = 'settings' in data || 'preferences' in data
      ? (data as { settings?: Partial<ISettings>; preferences?: Record<string, any> })
      : { settings: data as Partial<ISettings> };

    const previousUser = { ...user };

    // Optimistic update
    const updatedUser = { ...user };
    if (payload.settings) {
      updatedUser.settings = { ...user.settings, ...payload.settings };
    }
    if (payload.preferences) {
      updatedUser.preferences = { ...user.preferences, ...payload.preferences };
    }

    set({ user: updatedUser });

    try {
      await userService.updateSettings(payload);
      errorLogger.info('Settings/Preferences updated', { context: 'useUserStore', payload });
      await get().refreshUser();
    } catch (err) {
      set({ user: previousUser });
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

  terminateSessions: async () => {
    try {
      await import('../api/authService').then(m => m.terminateSessions());
      errorLogger.info('All other sessions terminated', { context: 'useUserStore' });
    } catch (err) {
      errorLogger.error('Failed to terminate sessions', err as Error, { context: 'useUserStore' });
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
  },

  uploadProfilePhoto: async (file: File) => {
    const { updateProfile } = get();
    try {
      const response = await userService.uploadFile(file);
      if (response.success && response.file.id) {
        await updateProfile({ uploadedProfilePhotoId: response.file.id });
      }
    } catch (err) {
      errorLogger.error('Failed to upload profile photo', err as Error, { context: 'useUserStore' });
      throw err;
    }
  }
}));
