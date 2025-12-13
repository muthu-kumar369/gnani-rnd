import errorLogger from "../utils/errorLogger";
import apiClient from './client'; // STAGE 1: Use API client

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    // Add other user properties as needed
  };
}

interface RegisterResponse {
  message: string;
  userId: string;
}

export const login = async (
  loginIdentifier: string,
  password: string
): Promise<LoginResponse> => {
  try {
    // STAGE 1: Use API client with retry logic
    const response = await import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
      apiClient.post('/auth/login', {
        loginIdentifier,
        password
      })
    ));

    return response.data;
  } catch (error) {
    errorLogger.error("Login API error:", error, { context: "AuthService" });
    throw error;
  }
};

export const register = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string
): Promise<RegisterResponse> => {
  try {
    // STAGE 1: Use API client with retry logic
    const response = await import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
      apiClient.post('/auth/register', {
        firstName,
        lastName,
        email,
        password
      })
    ));

    return response.data;
  } catch (error) {
    errorLogger.error("Register API error:", error, { context: "AuthService" });
    throw error;
  }
};

export const refreshToken = async (
  currentRefreshToken: string
): Promise<LoginResponse> => {
  try {
    // STAGE 1: Use API client with retry logic
    const response = await import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
      apiClient.post('/auth/refresh', {
        refreshToken: currentRefreshToken
      })
    ));

    return response.data;
  } catch (error) {
    errorLogger.error("Refresh Token API error:", error, {
      context: "AuthService",
    });
    throw error;
  }
};

export const logout = async (refreshToken?: string): Promise<void> => {
  try {
    // STAGE 1: Use API client with retry logic
    await import('../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
      apiClient.post('/auth/logout', { refreshToken })
    ));
  } catch (error) {
    // Log but don't block client-side logout
    errorLogger.error("Logout API error:", error, { context: "AuthService" });
  }
};
