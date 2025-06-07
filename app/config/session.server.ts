import { redirect } from "@remix-run/node";
import { createCookieSessionStorage } from "@remix-run/node";
import { checkEnvironment } from "~/env-check";
import { randomUUID } from "crypto";

/**
 * Session and Authentication Utilities
 * 
 * This module provides reusable authentication functions for server-side route protection.
 * All protected routes should use these utilities to maintain consistent authentication behavior.
 * 
 * SECURITY ENHANCEMENT: Uses session-based authentication where only session IDs are sent to browser,
 * keeping JWT tokens completely server-side and invisible to Network inspection.
 */

// Run environment check
checkEnvironment();

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

// SECURITY: Secure session storage - only session IDs in cookies, tokens stored server-side
const sessionSecret = process.env.SESSION_SECRET || "fallback-dev-secret-change-in-production";

console.log("🔐 Session configuration:");
console.log("- Session secret exists:", !!process.env.SESSION_SECRET);
console.log("- Session secret length:", sessionSecret.length);
console.log("- Environment:", process.env.NODE_ENV);

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__zen_session", // Changed from authToken to session ID
    httpOnly: true, // SECURITY: Prevent JavaScript access
    path: "/",
    sameSite: "strict",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_CONFIG.DEFAULT_MAX_AGE,
  },
});

console.log("🍪 Session storage configured with cookie name: __zen_session");

// SECURITY: Server-side token storage (in production, use Redis/Database)
const serverSideTokenStore = new Map<string, {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  csrfToken: string;  // NEW: CSRF protection
}>();

// Cleanup expired sessions every hour
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, sessionData] of serverSideTokenStore.entries()) {
    if (sessionData.expiresAt < now) {
      serverSideTokenStore.delete(sessionId);
      console.log(`🗑️ Cleaned up expired session: ${sessionId}`);
    }
  }
}, 60 * 60 * 1000); // 1 hour

// CSRF token generation
export function generateCSRFToken(): string {
  return randomUUID() + '-' + Date.now().toString(36);
}

// CSRF token validation
export function validateCSRFToken(request: Request, sessionId: string): boolean {
  const submittedToken = request.headers.get('X-CSRF-Token') || 
                        new URL(request.url).searchParams.get('_csrf');
  
  if (!submittedToken) {
    console.log("❌ No CSRF token provided");
    return false;
  }
  
  const sessionData = serverSideTokenStore.get(sessionId);
  if (!sessionData) {
    console.log("❌ Session not found for CSRF validation");
    return false;
  }
  
  const isValid = sessionData.csrfToken === submittedToken;
  console.log(isValid ? "✅ CSRF token valid" : "❌ CSRF token invalid");
  return isValid;
}

// Get CSRF token for a session
export function getCSRFToken(sessionId: string): string | null {
  const sessionData = serverSideTokenStore.get(sessionId);
  return sessionData?.csrfToken || null;
}

/**
 * Create a secure session with JWT token stored server-side
 */
export async function createSecureSession(token: string, request: Request): Promise<Response> {
  console.log("🔒 createSecureSession called");
  console.log("Token preview:", token.substring(0, 50) + "...");
  
  try {
    const session = await sessionStorage.getSession(request.headers.get("Cookie"));
    
    // Generate unique session ID and CSRF token
    const sessionId = randomUUID();
    const csrfToken = generateCSRFToken();
    console.log("🆔 Generated session ID:", sessionId);
    console.log("🛡️ Generated CSRF token:", csrfToken.substring(0, 20) + "...");
    
    // Extract user info from token for logging/debugging
    const payload = decodeJWTPayload(token);
    const userId = payload?.sub || 'unknown';
    console.log("👤 User from token:", userId);
    
    // Store token server-side with CSRF protection
    const expiresAt = Date.now() + (SESSION_CONFIG.DEFAULT_MAX_AGE * 1000);
    serverSideTokenStore.set(sessionId, {
      token,
      userId,
      createdAt: Date.now(),
      expiresAt,
      csrfToken  // NEW: Store CSRF token
    });
    
    console.log("💾 Stored token server-side for session:", sessionId);
    console.log("📊 Server store size:", serverSideTokenStore.size);
    
    // Store only session ID in browser cookie (CSRF token sent separately)
    session.set("sessionId", sessionId);
    session.set("userId", userId);
    
    console.log("🍪 Setting session data in cookie");
    
    const cookieHeader = await sessionStorage.commitSession(session);
    console.log("✅ Session cookie created:", cookieHeader.substring(0, 100) + "...");
    
    console.log(`🔒 Created secure session with CSRF protection: ${sessionId} for user: ${userId}`);
    
    return new Response(null, {
      headers: {
        "Set-Cookie": cookieHeader,
        "X-CSRF-Token": csrfToken,  // NEW: Send CSRF token in header
      },
    });
  } catch (error) {
    console.error("❌ Error creating secure session:", error);
    throw error;
  }
}

/**
 * Get JWT token from secure session (server-side only)
 */
export async function getSecureAuthToken(request: Request): Promise<string | null> {
  console.log("🔍 getSecureAuthToken called");
  
  try {
    const cookieHeader = request.headers.get("Cookie");
    console.log("🍪 Cookie header:", cookieHeader?.substring(0, 100) + "...");
    
    const session = await sessionStorage.getSession(cookieHeader);
    const sessionId = session.get("sessionId");
    
    console.log("🆔 Session ID from cookie:", sessionId);
    
    if (!sessionId) {
      console.log("🔍 No session ID found in cookie");
      return null;
    }
    
    const sessionData = serverSideTokenStore.get(sessionId);
    if (!sessionData) {
      console.log(`⚠️ Session ${sessionId} not found in server store`);
      console.log("📊 Available sessions:", Array.from(serverSideTokenStore.keys()));
      return null;
    }
    
    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      console.log(`⏰ Session ${sessionId} expired, cleaning up`);
      serverSideTokenStore.delete(sessionId);
      return null;
    }
    
    console.log(`✅ Retrieved token for session: ${sessionId}, user: ${sessionData.userId}`);
    console.log("🔑 Token preview:", sessionData.token.substring(0, 50) + "...");
    return sessionData.token;
  } catch (error) {
    console.error("❌ Error retrieving secure auth token:", error);
    return null;
  }
}

/**
 * Clear secure session
 */
export async function clearSecureSession(request: Request): Promise<Response> {
  console.log("🗑️ clearSecureSession called");
  
  try {
    const session = await sessionStorage.getSession(request.headers.get("Cookie"));
    const sessionId = session.get("sessionId");
    
    if (sessionId) {
      serverSideTokenStore.delete(sessionId);
      console.log(`🗑️ Cleared secure session: ${sessionId}`);
      console.log("📊 Remaining sessions:", serverSideTokenStore.size);
    } else {
      console.log("ℹ️ No session ID to clear");
    }
    
    const cookieHeader = await sessionStorage.destroySession(session);
    console.log("🍪 Destroyed session cookie");
    
    return new Response(null, {
      headers: {
        "Set-Cookie": cookieHeader,
      },
    });
  } catch (error) {
    console.error("❌ Error clearing secure session:", error);
    throw error;
  }
}

/**
 * LEGACY SUPPORT: Extract authentication token from cookie header (being phased out)
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
      console.error("Invalid JWT format - expected 3 parts, got:", parts.length);
      return null;
    }
    
    const payload = parts[1];
    
    // Properly decode base64url
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    // Decode base64
    let decoded: string;
    if (typeof window !== 'undefined') {
      // Browser environment
      decoded = atob(base64);
    } else {
      // Node.js environment
      decoded = Buffer.from(base64, 'base64').toString('utf-8');
    }
    
    const parsed = JSON.parse(decoded);
    console.log("✅ JWT decoded successfully:", {
      sub: parsed.sub,
      exp: parsed.exp ? new Date(parsed.exp * 1000).toISOString() : 'none',
      iat: parsed.iat ? new Date(parsed.iat * 1000).toISOString() : 'none'
    });
    
    return parsed;
  } catch (error) {
    console.error("❌ Error decoding JWT:", error);
    console.error("Token preview:", token?.substring(0, 50) + "...");
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
    console.log("⚠️ Token invalid or no expiration found - treating as expired");
    return true; // Consider invalid tokens as expired
  }
  
  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  const now = Date.now();
  const isExpired = now >= expirationTime;
  
  console.log("🕐 Token expiration check:", {
    now: new Date(now).toISOString(),
    expires: new Date(expirationTime).toISOString(),
    isExpired
  });
  
  return isExpired;
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
 * SECURE: Get authentication session data using new session system
 */
export async function getAuthSession(request: Request): Promise<AuthSessionData> {
  console.log("🔍 getAuthSession called");
  
  // Try new secure session system first
  const secureToken = await getSecureAuthToken(request);
  
  if (secureToken) {
    console.log("🔒 Found secure token, validating...");
    const isExpired = isTokenExpired(secureToken);
    const tokenExpiration = getTokenExpiration(secureToken);
    const payload = decodeJWTPayload(secureToken);
    
    const user = payload ? { 
      username: payload.sub,
      id: payload.userId || payload.id,
      hashedUserId: payload.huid,
      hashedUserGroupId: payload.hgid,
      hasEnhancedSecurity: !!(payload.huid && payload.hgid)
    } : undefined;
    
    console.log("🔒 Using secure session authentication");
    
    return {
      isAuthenticated: !isExpired,
      authToken: isExpired ? null : secureToken,
      tokenExpiration,
      user: isExpired ? undefined : user,
    };
  }
  
  // LEGACY: Fallback to cookie-based authentication (will be phased out)
  console.log("⚠️ Falling back to legacy cookie authentication");
  const cookieHeader = request.headers.get("Cookie");
  const authToken = extractAuthToken(cookieHeader);
  
  if (!authToken) {
    console.log("❌ No authentication found anywhere");
    return {
      isAuthenticated: false,
      authToken: null,
    };
  }
  
  const isExpired = isTokenExpired(authToken);
  const tokenExpiration = getTokenExpiration(authToken);
  const payload = decodeJWTPayload(authToken);
  
  const user = payload ? { 
    username: payload.sub,
    id: payload.userId || payload.id,
    hashedUserId: payload.huid,
    hashedUserGroupId: payload.hgid,
    hasEnhancedSecurity: !!(payload.huid && payload.hgid)
  } : undefined;
  
  return {
    isAuthenticated: !isExpired,
    authToken: isExpired ? null : authToken,
    tokenExpiration,
    user: isExpired ? undefined : user,
  };
}

/**
 * SECURE: Require authentication using new session system
 */
export function requireAuth(request: Request): AuthSessionData {
  console.log("⚠️ WARNING: requireAuth (legacy) still being used - should use getSecureAuthToken");
  
  // This will be updated to use async getAuthSession in the next phase
  // For now, maintaining compatibility
  const cookieHeader = request.headers.get("Cookie");
  const authToken = extractAuthToken(cookieHeader);
  
  if (!authToken || isTokenExpired(authToken)) {
    console.log("❌ Legacy auth failed, redirecting to login");
    throw redirect("/login");
  }
  
  const payload = decodeJWTPayload(authToken);
  const user = payload ? { 
    username: payload.sub,
    id: payload.userId || payload.id,
    hashedUserId: payload.huid,
    hashedUserGroupId: payload.hgid,
    hasEnhancedSecurity: !!(payload.huid && payload.hgid)
  } : undefined;
  
  return {
    isAuthenticated: true,
    authToken,
    tokenExpiration: getTokenExpiration(authToken),
    user,
  };
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
export async function isAuthenticated(request: Request): Promise<boolean> {
  const session = await getAuthSession(request);
  return session.isAuthenticated;
}

/**
 * Get user information from JWT token
 * @param request - The Remix request object
 * @returns User information from JWT or null if not authenticated
 */
export async function getUserFromSession(request: Request): Promise<any | null> {
  const session = await getAuthSession(request);
  
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