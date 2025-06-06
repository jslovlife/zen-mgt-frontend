// API Configuration
export const API_CONFIG = {
  // Use typeof window check to avoid process access in browser
  BASE_URL: (typeof window === 'undefined' 
    ? process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:8080'
    : window.ENV?.API_URL || 'http://localhost:8080'
  ),
  TIMEOUT: 30000,
  
  // API versioning - updated to match backend structure
  API_VERSION: 'v1',
  API_PREFIX: '/api/mgt/v1',
  
  ENDPOINTS: {
    // Authentication endpoints
    AUTH: {
      CONFIG: '/auth/config',
      LOGIN: '/auth/login',
      OAUTH2_LOGIN: '/auth/oauth2/login',
      MFA_VERIFY: '/auth/mfa/verify',
      MFA_SETUP: '/auth/mfa/setup',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh'
    },
    
    // User Management endpoints - updated to match Postman collection
    USERS: {
      LIST: '/users',                    // GET with pagination
      SEARCH: '/users/search',           // GET with search params
      CREATE: '/users',                  // POST
      GET_BY_ID: '/users',              // GET /{encryptedUserId}
      GET_BY_CODE: '/users/by-code',    // GET /{userCode}
      UPDATE: '/users',                 // PUT /{encryptedUserId}
      DELETE: '/users',                 // DELETE /{encryptedUserId}
      CHECK_USERNAME: '/users/check-username',  // GET /{username}
      CHECK_EMAIL: '/users/check-email',        // GET /{email}
      TOGGLE_STATUS: '/users',          // PUT /{encryptedUserId}/toggle-status
      STATUS_STATS: '/users/status-stats'       // GET
    },
    
    // System endpoints
    SYSTEM: {
      HEALTH: '/actuator/health'
    }
  }
};

// Debug logging for API configuration (only on server-side)
if (typeof window === 'undefined') {
  console.log("=== API CONFIG DEBUG ===");
  console.log("API_URL env var:", process.env.API_URL);
  console.log("VITE_API_URL env var:", process.env.VITE_API_URL);
  console.log("Final BASE_URL:", API_CONFIG.BASE_URL);
  console.log("Login endpoint:", API_CONFIG.ENDPOINTS.AUTH.LOGIN);
  console.log("Full login URL:", `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`);
}

// Helper function to build full API URLs
export function buildApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}

// Declare window.ENV for TypeScript
declare global {
  interface Window {
    ENV?: {
      API_URL?: string;
    };
  }
} 