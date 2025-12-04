import errorLogger from "../utils/errorLogger"; // Import errorLogger

// Assuming the backend is running on http://localhost:3000
const API_BASE_URL = "http://localhost:3000/api/auth";

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
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ loginIdentifier, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Login failed");
    }

    const data: LoginResponse = await response.json();
    return data;
  } catch (error) {
    errorLogger.error("Login API error:", error, { context: "AuthService" });
    throw error;
  }
};

export const register = async (
  username: string,
  email: string,
  password: string
): Promise<RegisterResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Registration failed");
    }

    const data: RegisterResponse = await response.json();
    return data;
  } catch (error) {
    errorLogger.error("Register API error:", error, { context: "AuthService" });
    throw error;
  }
};

export const refreshToken = async (
  currentRefreshToken: string
): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to refresh token");
    }

    const data: LoginResponse = await response.json();
    return data;
  } catch (error) {
    errorLogger.error("Refresh Token API error:", error, {
      context: "AuthService",
    });
    throw error;
  }
};

export const logout = async (refreshToken?: string): Promise<void> => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers["x-auth-token"] = accessToken;
    }

    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      headers,
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // We don't throw here because we want to proceed with client-side logout anyway
      errorLogger.warn("Logout API returned error status", { context: "AuthService", status: response.status });
    }
  } catch (error) {
    // Log but don't block client-side logout
    errorLogger.error("Logout API error:", error, { context: "AuthService" });
  }
};
