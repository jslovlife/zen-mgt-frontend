/**
 * Authentication Migration Utility
 * 
 * This utility forcefully migrates from legacy cookie-based authentication
 * to the new secure session-based authentication system.
 */

export class AuthMigrationUtil {
  private static instance: AuthMigrationUtil;

  private constructor() {}

  public static getInstance(): AuthMigrationUtil {
    if (!AuthMigrationUtil.instance) {
      AuthMigrationUtil.instance = new AuthMigrationUtil();
    }
    return AuthMigrationUtil.instance;
  }

  /**
   * CRITICAL: Force complete migration from legacy auth to secure sessions
   * This clears ALL legacy authentication data
   */
  public forceCompleteMigration(): void {
    if (typeof window === 'undefined') {
      console.log("⚠️ AuthMigration: Not in browser environment");
      return;
    }

    console.log("🚨 FORCING COMPLETE AUTH MIGRATION");
    console.log("💥 CLEARING ALL LEGACY AUTHENTICATION DATA");

    // Step 1: Clear all localStorage tokens
    const localStorageKeys = [
      'authToken',
      'auth_token', 
      'accessToken',
      'access_token',
      'bearerToken',
      'bearer_token',
      'tempToken',
      'temp_token',
      'userToken',
      'user_token',
      'jwt',
      'JWT',
      'token',
      'zen_secure_auth'
    ];

    localStorageKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🗑️ Cleared localStorage: ${key}`);
      }
    });

    // Step 2: Clear all sessionStorage tokens
    const sessionStorageKeys = [
      'zen_secure_auth',
      'authToken',
      'tempToken',
      'sessionToken'
    ];

    sessionStorageKeys.forEach(key => {
      if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
        console.log(`🗑️ Cleared sessionStorage: ${key}`);
      }
    });

    // Step 3: FORCE CLEAR ALL LEGACY COOKIES
    this.clearAllLegacyCookies();

    console.log("✅ COMPLETE AUTH MIGRATION SUCCESSFUL");
    console.log("🔒 Only secure session cookies should remain");
  }

  /**
   * Aggressively clear all legacy authentication cookies
   */
  private clearAllLegacyCookies(): void {
    console.log("🍪 FORCE CLEARING ALL LEGACY COOKIES");

    // List of all possible legacy cookie names
    const legacyCookieNames = [
      'authToken',
      'auth_token',
      'accessToken', 
      'access_token',
      'bearerToken',
      'bearer_token',
      'userToken',
      'user_token',
      'jwt',
      'JWT',
      'token',
      'sessionToken',
      'session_token'
    ];

    // Clear each possible legacy cookie with all possible configurations
    legacyCookieNames.forEach(cookieName => {
      // Clear for root domain
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
      
      // Clear for current subdomain
      const hostname = window.location.hostname;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname};`;
      
      console.log(`🗑️ Force cleared cookie: ${cookieName}`);
    });

    // Verify cookie clearing
    const remainingCookies = document.cookie;
    console.log("🔍 Remaining cookies after cleanup:", remainingCookies);
    
    if (remainingCookies.includes('authToken=')) {
      console.error("⚠️ WARNING: authToken still present in cookies!");
      console.log("🔥 ATTEMPTING NUCLEAR COOKIE CLEAR");
      
      // Nuclear option: Clear ALL cookies
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;`;
          console.log(`🔥 Nuclear cleared cookie: ${name}`);
        }
      });
    }
  }

  /**
   * Check if legacy authentication is still present
   */
  public hasLegacyAuth(): boolean {
    if (typeof window === 'undefined') return false;

    // Check localStorage
    const hasLocalStorage = localStorage.getItem('authToken') !== null;
    
    // Check cookies
    const hasCookies = document.cookie.includes('authToken=');
    
    // Check sessionStorage
    const hasSessionStorage = sessionStorage.getItem('zen_secure_auth') !== null;

    return hasLocalStorage || hasCookies || hasSessionStorage;
  }

  /**
   * Get current authentication status
   */
  public getAuthStatus(): {
    hasLegacyAuth: boolean;
    hasSecureSession: boolean;
    recommendations: string[];
  } {
    if (typeof window === 'undefined') {
      return {
        hasLegacyAuth: false,
        hasSecureSession: false,
        recommendations: ['Server-side environment detected']
      };
    }

    const hasLegacyAuth = this.hasLegacyAuth();
    const hasSecureSession = document.cookie.includes('__zen_session=');
    
    const recommendations: string[] = [];
    
    if (hasLegacyAuth) {
      recommendations.push('⚠️ Legacy auth detected - run forceCompleteMigration()');
    }
    
    if (!hasSecureSession) {
      recommendations.push('🔒 No secure session - login required');
    }
    
    if (!hasLegacyAuth && hasSecureSession) {
      recommendations.push('✅ Migration complete - secure session active');
    }

    return {
      hasLegacyAuth,
      hasSecureSession,
      recommendations
    };
  }

  /**
   * Debug utility to show all authentication-related storage
   */
  public debugAuthState(): void {
    if (typeof window === 'undefined') {
      console.log("Debug: Server-side environment");
      return;
    }

    console.group('🔍 AUTH STATE DEBUG');
    
    console.log('📍 Current URL:', window.location.href);
    console.log('🍪 All Cookies:', document.cookie);
    
    console.log('💾 LocalStorage tokens:');
    ['authToken', 'zen_secure_auth', 'tempToken'].forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`  ${key}:`, value ? value.substring(0, 50) + '...' : 'null');
    });
    
    console.log('📦 SessionStorage tokens:');
    ['zen_secure_auth', 'authToken'].forEach(key => {
      const value = sessionStorage.getItem(key);
      console.log(`  ${key}:`, value ? value.substring(0, 50) + '...' : 'null');
    });
    
    const status = this.getAuthStatus();
    console.log('📊 Auth Status:', status);
    
    console.groupEnd();
  }
}

// Export singleton instance and attach to window for debugging
export const authMigration = AuthMigrationUtil.getInstance();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).authMigration = authMigration;
} 