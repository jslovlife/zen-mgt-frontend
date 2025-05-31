// API Configuration
export const API_CONFIG = {
  BASE_URL: typeof window !== 'undefined' 
    ? "http://localhost:8080/api/mgt/v1" // Client-side fallback
    : (process.env.API_BASE_URL || "http://localhost:8080/api/mgt/v1"), // Server-side
  ENDPOINTS: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    CHECK_USER: "/auth/check-user",
    MFA_SETUP_INIT: "/mfa/setup/init",
    MFA_SETUP_VERIFY: "/mfa/setup/verify",
    MFA_VERIFY: "/auth/login", // Same endpoint with MFA code
  },
  TIMEOUT: 10000, // 10 seconds
};

// Debug logging for API configuration (only on server-side)
if (typeof window === 'undefined') {
  console.log("=== API CONFIG DEBUG ===");
  console.log("API_BASE_URL env var:", process.env.API_BASE_URL);
  console.log("Final BASE_URL:", API_CONFIG.BASE_URL);
  console.log("Login endpoint:", API_CONFIG.ENDPOINTS.LOGIN);
  console.log("Full login URL:", `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`);
}

// Helper function to build full API URLs
export function buildApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
} 