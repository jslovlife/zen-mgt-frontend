import { redirect } from "@remix-run/node";

/**
 * Session and Authentication Utilities
 * 
 * This module provides reusable authentication functions for server-side route protection.
 * All protected routes should use these utilities to maintain consistent authentication behavior.
 */

// Configuration for token validity
export const SESSION_CONFIG = {
  // Default cookie expiration (should match backend token expiration)
  DEFAULT_MAX_AGE: 24 * 60 * 60, // 24 hours in seconds
  
  // Different expiration times for different scenarios
  SHORT_SESSION: 2 * 60 * 60,     // 2 hours
  STANDARD_SESSION: 24 * 60 * 60,  // 24 hours  
  EXTENDED_SESSION: 7 * 24 * 60 * 60, // 7 days
  
  // Security settings
  SECURE_COOKIE_IN_PRODUCTION: true,
  SAME_SITE: "Strict" as const,
} as const;

export interface AuthSessionData {
  isAuthenticated: boolean;
  authToken: string | null;
  tokenExpiration?: Date | null;
  user?: {
    username?: string;
    id?: number;
    userGroupId?: number;
    hashedUserId?: string;  // NEW: Hashed User ID from JWT
    hashedUserGroupId?: string;  // NEW: Hashed User Group ID from JWT
    hasEnhancedSecurity?: boolean;  // NEW: Whether token has enhanced security features
    // Add more user fields as needed
  };
}

/**
 * Extract authentication token from cookie header
 * @param cookieHeader - The Cookie header string from the request
 * @returns The authentication token or null if not found
 */
export function extractAuthToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const authCookie = cookies.find(c => c.startsWith('authToken='));
  
  if (!authCookie) {
    return null;
  }

  return authCookie.split('=')[1];
}

/**
 * Decode JWT token to extract expiration and other information
 * Note: This is a basic implementation. In production, consider using a proper JWT library
 * @param token - The JWT token
 * @returns Decoded payload or null if invalid
 */
export function decodeJWTPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * @param token - The JWT token
 * @returns boolean indicating if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWTPayload(token);
  if (!payload || !payload.exp) {
    return true; // Consider invalid tokens as expired
  }
  
  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  return Date.now() >= expirationTime;
}

/**
 * Get token expiration date
 * @param token - The JWT token
 * @returns Date object or null if no expiration found
 */
export function getTokenExpiration(token: string): Date | null {
  const payload = decodeJWTPayload(token);
  if (!payload || !payload.exp) {
    return null;
  }
  
  return new Date(payload.exp * 1000);
}

/**
 * Calculate cookie max age based on token expiration
 * @param token - The JWT token
 * @returns Max age in seconds or default value
 */
export function calculateCookieMaxAge(token: string): number {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return SESSION_CONFIG.DEFAULT_MAX_AGE;
  }
  
  const timeUntilExpiration = Math.floor((expiration.getTime() - Date.now()) / 1000);
  
  // Don't allow negative values or values greater than the default
  return Math.max(0, Math.min(timeUntilExpiration, SESSION_CONFIG.DEFAULT_MAX_AGE));
}

/**
 * Get authentication session data from request
 * @param request - The Remix request object
 * @returns Session data containing authentication status and token
 */
export function getAuthSession(request: Request): AuthSessionData {
  const cookieHeader = request.headers.get("Cookie");
  const authToken = extractAuthToken(cookieHeader);
  
  if (!authToken) {
    return {
      isAuthenticated: false,
      authToken: null,
    };
  }
  
  // Check if token is expired
  const isExpired = isTokenExpired(authToken);
  const tokenExpiration = getTokenExpiration(authToken);
  
  // Get user info from token
  const payload = decodeJWTPayload(authToken);
  
  // Debug JWT token contents in development
  if (process.env.NODE_ENV === 'development' && payload) {
    console.log("=== JWT TOKEN DEBUG ===");
    console.log("Available claims:", Object.keys(payload));
    console.log("Username (sub):", payload.sub);
    console.log("User ID (id/userId):", payload.id || payload.userId);
    console.log("Hashed User ID (huid):", payload.huid || "NOT PRESENT");
    console.log("Hashed User Group ID (hgid):", payload.hgid || "NOT PRESENT");
    console.log("Enhanced Security Available:", !!(payload.huid && payload.hgid));
    console.log("Token Expiry:", payload.exp ? new Date(payload.exp * 1000).toISOString() : "Unknown");
    console.log("========================");
  }
  
  const user = payload ? { 
    username: payload.sub,
    id: payload.userId || payload.id, // Support both 'userId' and 'id' field names (legacy)
    hashedUserId: payload.huid,  // NEW: Hashed User ID
    hashedUserGroupId: payload.hgid,  // NEW: Hashed User Group ID
    hasEnhancedSecurity: !!(payload.huid && payload.hgid)  // NEW: Enhanced security detection
  } : undefined;
  
  return {
    isAuthenticated: !isExpired,
    authToken: isExpired ? null : authToken,
    tokenExpiration,
    user: isExpired ? undefined : user,
  };
}

/**
 * Require authentication for a route loader
 * If not authenticated, automatically redirects to login page
 * @param request - The Remix request object
 * @param redirectTo - Optional custom redirect path (defaults to "/login")
 * @returns Session data if authenticated, throws redirect if not
 */
export function requireAuth(request: Request, redirectTo: string = "/login"): AuthSessionData {
  const session = getAuthSession(request);
  
  if (!session.isAuthenticated) {
    throw redirect(redirectTo);
  }
  
  return session;
}

/**
 * Create an authentication cookie value with smart expiration
 * @param token - The JWT authentication token
 * @param options - Cookie configuration options
 * @returns Formatted cookie string
 */
export function createAuthCookie(
  token: string, 
  options: {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
    path?: string;
    useTokenExpiration?: boolean; // Auto-calculate from token expiration
  } = {}
): string {
  const {
    maxAge = options.useTokenExpiration ? calculateCookieMaxAge(token) : SESSION_CONFIG.DEFAULT_MAX_AGE,
    httpOnly = true,
    secure = SESSION_CONFIG.SECURE_COOKIE_IN_PRODUCTION && process.env.NODE_ENV === 'production',
    sameSite = SESSION_CONFIG.SAME_SITE,
    path = "/",
    useTokenExpiration = true, // Default to using token expiration
  } = options;

  let cookieValue = `authToken=${token}`;
  
  if (httpOnly) cookieValue += "; HttpOnly";
  if (secure) cookieValue += "; Secure";
  if (path) cookieValue += `; Path=${path}`;
  if (maxAge > 0) cookieValue += `; Max-Age=${maxAge}`;
  if (sameSite) cookieValue += `; SameSite=${sameSite}`;
  
  return cookieValue;
}

/**
 * Create a cookie to clear the authentication token
 * @returns Cookie string that clears the auth token
 */
export function createClearAuthCookie(): string {
  return "authToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict";
}

/**
 * Check if user is authenticated (non-throwing version)
 * Useful for conditional rendering or optional authentication
 * @param request - The Remix request object
 * @returns boolean indicating authentication status
 */
export function isAuthenticated(request: Request): boolean {
  const session = getAuthSession(request);
  return session.isAuthenticated;
}

/**
 * Get user information from JWT token
 * @param request - The Remix request object
 * @returns User information from JWT or null if not authenticated
 */
export function getUserFromSession(request: Request): any | null {
  const session = getAuthSession(request);
  
  if (!session.authToken) {
    return null;
  }
  
  return decodeJWTPayload(session.authToken);
}

/**
 * Protected route loader wrapper
 * Use this wrapper for any route that requires authentication
 * @param loaderFn - The actual loader function to execute if authenticated
 * @returns Protected loader function
 */
export function protectedLoader<T>(
  loaderFn: (args: any, session: AuthSessionData) => T
) {
  return (args: any) => {
    const session = requireAuth(args.request);
    return loaderFn(args, session);
  };
}

/**
 * Create different types of auth cookies based on session type
 */
export const createSessionCookie = {
  /** Short session (2 hours) - for sensitive operations */
  short: (token: string) => createAuthCookie(token, { 
    maxAge: SESSION_CONFIG.SHORT_SESSION,
    useTokenExpiration: false 
  }),
  
  /** Standard session (24 hours) - default behavior */
  standard: (token: string) => createAuthCookie(token, { 
    maxAge: SESSION_CONFIG.STANDARD_SESSION,
    useTokenExpiration: false 
  }),
  
  /** Extended session (7 days) - remember me functionality */
  extended: (token: string) => createAuthCookie(token, { 
    maxAge: SESSION_CONFIG.EXTENDED_SESSION,
    useTokenExpiration: false 
  }),
  
  /** Auto-expiring session - matches JWT token expiration exactly */
  auto: (token: string) => createAuthCookie(token, { 
    useTokenExpiration: true 
  }),
};

/**
 * Enhanced JWT utility functions for enhanced security integration
 */
export class JWTUtil {
  /**
   * Extract all claims from JWT token
   */
  static extractClaims(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to extract JWT claims:', error);
      return null;
    }
  }

  /**
   * Extract username from token
   */
  static extractUsername(token: string): string | null {
    const claims = this.extractClaims(token);
    return claims?.sub || null;
  }

  /**
   * Extract hashed user ID from token
   */
  static extractHashedUserId(token: string): string | null {
    const claims = this.extractClaims(token);
    return claims?.huid || null;
  }

  /**
   * Extract hashed user group ID from token
   */
  static extractHashedUserGroupId(token: string): string | null {
    const claims = this.extractClaims(token);
    return claims?.hgid || null;
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const claims = this.extractClaims(token);
    if (!claims?.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return claims.exp < currentTime;
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    const claims = this.extractClaims(token);
    return claims?.exp ? new Date(claims.exp * 1000) : null;
  }

  /**
   * Check if user has enhanced security features
   */
  static hasEnhancedSecurity(token: string): boolean {
    const claims = this.extractClaims(token);
    return !!(claims?.huid && claims?.hgid);
  }

  /**
   * Debug utility for development
   */
  static logTokenInfo(token: string) {
    if (process.env.NODE_ENV !== 'development') return;
    
    const claims = this.extractClaims(token);
    console.group('🔐 JWT Token Information');
    console.log('Username:', claims?.sub);
    console.log('Hashed User ID:', claims?.huid ? 'Present' : 'Missing');
    console.log('Hashed User Group ID:', claims?.hgid ? 'Present' : 'Missing');
    console.log('Issued At:', new Date((claims?.iat || 0) * 1000));
    console.log('Expires At:', new Date((claims?.exp || 0) * 1000));
    console.log('Enhanced Security:', !!(claims?.huid && claims?.hgid));
    console.groupEnd();
  }
} 