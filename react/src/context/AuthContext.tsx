import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { refreshToken as callRefreshTokenAPI } from '../api/authService';
import errorLogger from '../utils/errorLogger'; // Import errorLogger

/**
 * @file This file provides authentication context to the React application.
 *       It manages authentication state, tokens, and provides methods for login, logout, and token refreshing.
 */

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null; // TODO: Define a proper User type for better type safety
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  setAuthState: (newState: {
    isAuthenticated?: boolean;
    user?: any | null;
    accessToken?: string | null;
    refreshToken?: string | null;
    loading?: boolean;
    error?: string | null;
  }) => void;
  logout: () => void;
  refreshAuthToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}



export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const setAuthState = useCallback(async (newState: {
    isAuthenticated?: boolean;
    user?: any | null;
    accessToken?: string | null;
    refreshToken?: string | null;
    loading?: boolean;
    error?: string | null;
  }) => {
    if (newState.isAuthenticated !== undefined) setIsAuthenticated(newState.isAuthenticated);
    if (newState.user !== undefined) setUser(newState.user);
    if (newState.accessToken !== undefined) setAccessToken(newState.accessToken);
    if (newState.refreshToken !== undefined) setRefreshToken(newState.refreshToken);
    if (newState.loading !== undefined) setLoading(newState.loading);
    if (newState.error !== undefined) setError(newState.error);

    if (window.gnani?.auth && newState.accessToken && newState.refreshToken) {
      await window.gnani.auth.storeTokens(newState.accessToken, newState.refreshToken);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsAuthenticated(false);
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    if (window.gnani?.auth) {
      await window.gnani.auth.clearTokens();
    }
    errorLogger.info('User logged out.', { context: 'AuthContext' });
  }, []);

  const refreshAuthToken = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) {
      errorLogger.warn('No refresh token available. Logging out.', { context: 'AuthContext' });
      logout();
      return false;
    }

    try {
      const response = await callRefreshTokenAPI(refreshToken);
      if (response && response.accessToken && response.refreshToken) {
        setAuthState({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });
        errorLogger.info('Tokens refreshed successfully.', { context: 'AuthContext' });
        return true;
      } else {
        errorLogger.error('Refresh token API did not return valid tokens.', null, { context: 'AuthContext' });
        logout();
        return false;
      }
    } catch (err) {
      errorLogger.error('Failed to refresh token:', err, { context: 'AuthContext' });
      logout();
      return false;
    }
  }, [refreshToken, logout, setAuthState]);

  useEffect(() => {
    const loadTokens = async () => {
      if (window.gnani?.auth) {
        try {
          const { accessToken, refreshToken } = await window.gnani.auth.getTokens();
          if (accessToken && refreshToken) {
            // TODO: Implement token validation (e.g., check expiry, make a /me API call)
            setAuthState({ isAuthenticated: true, accessToken, refreshToken, loading: false });
            // TODO: Fetch user data using the token if necessary
          } else {
            setAuthState({ isAuthenticated: false, loading: false });
          }
        } catch (err) {
          errorLogger.error('Failed to load tokens from secure storage:', err, { context: 'AuthContext' });
          setAuthState({ isAuthenticated: false, loading: false, error: 'Failed to load session.' });
        }
      } else {
        errorLogger.warn('Electron IPC for auth not available. Running without secure storage.', { context: 'AuthContext' });
        setAuthState({ isAuthenticated: false, loading: false });
      }
    };
    loadTokens();
  }, [setAuthState]);

  useEffect(() => {
    if (!loading && window.gnani?.auth && accessToken && refreshToken) {
      window.gnani.auth.storeTokens(accessToken, refreshToken).catch((err) => errorLogger.error('Failed to store tokens securely:', err, { context: 'AuthContext' }));
    } else if (!loading && window.gnani?.auth && (!accessToken || !refreshToken)) {
      window.gnani.auth.clearTokens().catch((err) => errorLogger.error('Failed to clear tokens securely:', err, { context: 'AuthContext' }));
    }
  }, [accessToken, refreshToken, loading]);


  const value = {
    isAuthenticated,
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    setAuthState,
    logout,
    refreshAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
