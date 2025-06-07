import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { API_CONFIG } from "~/config/api";
import type { User, CreateUserRequest, UpdateUserRequest, SessionValidityRequest, SessionValidityResponse } from "~/types/user.type";
import { securityMonitor } from "~/utils/security-monitor.util";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

// Backend standardized response format
export interface BackendResponse<T = any> {
  code: string;    // "0000" for success, error codes for failures
  msg: string;     // Message description
  data: T | null;  // Response data
}

export interface LoginRequest {
  username: string;
  password: string;
  mfaCode?: string;
}

export interface LoginResponse {
  token?: string;
  hashedUserId?: string;  // Updated to match backend
  user?: {
    id: number;
    email: string;
    name: string;
    role?: string;
    mfaEnabled?: boolean;
  };
  requireMfa?: boolean;
  requireMfaSetup?: boolean;
  recoveryCodes?: string[];
  tempToken?: string;
}

export interface MfaSetupRequest {
  tempToken: string;
}

export interface MfaSetupResponse {
  qrCodeUrl: string;
  secret: string;
  backupCodes: string[];
}

export interface MfaVerifyRequest {
  tempToken: string;
  mfaCode: string;
}

export interface MfaVerifyResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role?: string;
    mfaEnabled: boolean;
  };
}

export interface MfaEnableRequest {
  mfaCode: string;
}

export interface UserInfoResponse {
  id: number;
  username: string;
  email: string;
  name: string;
  role?: string;
  mfaEnabled: boolean;
  mfaSetupRequired?: boolean;
}

export interface CheckUserRequest {
  username: string;
}

export interface CheckUserResponse {
  mfaEnabled: boolean;
  mfaSetupRequired?: boolean;
}

// Security Enhancement Classes
class SecurityFingerprint {
  private static instance: SecurityFingerprint;
  private fingerprint: string;

  private constructor() {
    this.fingerprint = this.generateFingerprint();
  }

  public static getInstance(): SecurityFingerprint {
    if (!SecurityFingerprint.instance) {
      SecurityFingerprint.instance = new SecurityFingerprint();
    }
    return SecurityFingerprint.instance;
  }

  private generateFingerprint(): string {
    if (typeof window === 'undefined') return 'server-side';
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Browser fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency || 0,
      (navigator as any).deviceMemory || 0 // TypeScript fix for optional property
    ].join('|');
    
    return btoa(fingerprint).substring(0, 32);
  }

  public getFingerprint(): string {
    return this.fingerprint;
  }

  public validateFingerprint(storedFingerprint: string): boolean {
    return this.fingerprint === storedFingerprint;
  }
}

class TokenSecurity {
  private static readonly ENCRYPTION_KEY = 'ZEN_MGT_SECURITY_2024';
  
  public static encrypt(data: string): string {
    if (typeof window === 'undefined') return data;
    
    try {
      // Simple encryption (in production, use Web Crypto API)
      let encrypted = '';
      for (let i = 0; i < data.length; i++) {
        encrypted += String.fromCharCode(
          data.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length)
        );
      }
      return btoa(encrypted);
    } catch {
      return data;
    }
  }

  public static decrypt(encryptedData: string): string {
    if (typeof window === 'undefined') return encryptedData;
    
    try {
      const data = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < data.length; i++) {
        decrypted += String.fromCharCode(
          data.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length)
        );
      }
      return decrypted;
    } catch {
      return encryptedData;
    }
  }

  public static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expiry;
    } catch {
      return true; // Assume expired if we can't parse
    }
  }

  public static getTokenExpiry(token: string): Date | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  }
}

export class APIUtil {
  private static instance: APIUtil;
  private axiosInstance: AxiosInstance;
  private serverAuthToken?: string;
  private currentUserHashedId?: string; // For X-Current-User header
  private fingerprint: SecurityFingerprint;
  private tokenRefreshTimer?: NodeJS.Timeout;
  private csrfToken?: string;  // NEW: CSRF token storage

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      withCredentials: true, // Include cookies with requests
    });

    this.fingerprint = SecurityFingerprint.getInstance();
    this.setupInterceptors();
    this.setupTokenRefresh();
    this.loadCSRFToken();  // NEW: Load CSRF token
    
    // SECURITY: Force complete migration on startup
    this.performSecurityMigration();
  }

  public static getInstance(): APIUtil {
    if (!APIUtil.instance) {
      APIUtil.instance = new APIUtil();
    }
    return APIUtil.instance;
  }

  public setServerAuthToken(token: string): void {
    this.serverAuthToken = token;
    // Extract current user hashed ID from token for X-Current-User header
    this.extractUserIdFromToken(token);
  }

  public clearServerAuthToken(): void {
    this.serverAuthToken = undefined;
    this.currentUserHashedId = undefined;
  }

  private extractUserIdFromToken(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.currentUserHashedId = payload.huid || payload.encryptedUserId || payload.sub;
    } catch (error) {
      console.warn('Failed to extract user ID from token:', error);
    }
  }

  private setupTokenRefresh(): void {
    // Set up automatic token refresh 5 minutes before expiry
    const checkTokenExpiry = () => {
      const token = this.getAuthToken();
      if (token && !TokenSecurity.isTokenExpired(token)) {
        const expiry = TokenSecurity.getTokenExpiry(token);
        if (expiry) {
          const timeUntilRefresh = expiry.getTime() - Date.now() - (5 * 60 * 1000); // 5 minutes before expiry
          if (timeUntilRefresh > 0) {
            this.tokenRefreshTimer = setTimeout(() => {
              this.refreshTokenSilently();
            }, timeUntilRefresh);
          } else {
            this.refreshTokenSilently();
          }
        }
      }
    };

    checkTokenExpiry();
    setInterval(checkTokenExpiry, 60000); // Check every minute
  }

  private async refreshTokenSilently(): Promise<void> {
    try {
      console.log("🔄 Attempting silent token refresh...");
      const response = await this.refreshToken();
      if (response.success && response.data?.token) {
        this.setAuthToken(response.data.token);
        console.log("✅ Token refreshed successfully");
      } else {
        console.warn("⚠️ Token refresh failed, redirecting to login");
        this.handleTokenExpiry();
      }
    } catch (error) {
      console.error("❌ Token refresh error:", error);
      this.handleTokenExpiry();
    }
  }

  private handleTokenExpiry(): void {
    this.clearAuthToken();
    this.clearTempToken();
    this.clearServerAuthToken();
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        
        // Security: Add fingerprint header
        config.headers['X-Browser-Fingerprint'] = this.fingerprint.getFingerprint();
        
        // Security: Add request timestamp
        config.headers['X-Request-Time'] = Date.now().toString();
        
        if (token) {
          // Security: Check token expiry before using
          if (TokenSecurity.isTokenExpired(token)) {
            console.warn("🚨 Token expired, clearing and redirecting to login");
            this.handleTokenExpiry();
            return Promise.reject(new Error('Token expired'));
          }
          
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add X-Current-User header for operations that require it
        if (this.currentUserHashedId) {
          config.headers['X-Current-User'] = this.currentUserHashedId;
        }
        
        // Debug logging for important requests
        if (config.url?.includes('toggle-status')) {
          console.log("=== TOGGLE STATUS REQUEST HEADERS ===");
          console.log("Authorization header:", config.headers.Authorization ? "SET" : "MISSING");
          console.log("X-Current-User header:", config.headers['X-Current-User'] || "MISSING");
          console.log("X-Browser-Fingerprint header:", config.headers['X-Browser-Fingerprint']);
          console.log("Current user hashed ID:", this.currentUserHashedId || "NOT SET");
        }
        
        // NEW: Add CSRF token to requests
        if (this.csrfToken) {
          config.headers['X-CSRF-Token'] = this.csrfToken;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Security: Validate response fingerprint if provided
        const responseFingerprint = response.headers['x-server-fingerprint'];
        if (responseFingerprint) {
          // Server can validate client fingerprint and send back confirmation
          console.log("🔒 Server fingerprint validation:", responseFingerprint);
        }
        
        // NEW: Extract CSRF token from response headers
        const newCSRFToken = response.headers['x-csrf-token'];
        if (newCSRFToken) {
          this.setCSRFToken(newCSRFToken);
        }
        
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          console.warn("🚨 401 Unauthorized detected");
          this.clearAuthToken();
          this.clearTempToken();
          
          // Only redirect immediately for direct API calls from client-side
          // Let server-side loader handle session expiration more gracefully
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/dashboard')) {
            console.log("🔀 Client-side 401 redirect to login");
            window.location.href = '/login';
          } else {
            console.log("🔀 401 detected but allowing component-level handling");
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Transform backend response to frontend format
  private transformBackendResponse<T>(backendResponse: BackendResponse<T>): ApiResponse<T> {
    const isSuccess = backendResponse.code === '0000';
    return {
      success: isSuccess,
      data: isSuccess ? backendResponse.data || undefined : undefined,
      error: isSuccess ? undefined : backendResponse.msg || 'Unknown error'
    };
  }

  private async handleRequest<T>(
    request: Promise<AxiosResponse<BackendResponse<T>>>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await request;
      return this.transformBackendResponse(response.data);
    } catch (error: any) {
      console.error('API request failed:', error);
      
      if (error.response?.data && typeof error.response.data === 'object') {
        // Backend error response
        return this.transformBackendResponse(error.response.data);
      }
      
      return {
        success: false,
        error: error.message || 'Network error occurred',
        status: error.response?.status
      };
    }
  }

  /**
   * Extract authentication token from HTTP-only cookies
   * This bridges the gap between server-side cookie authentication and client-side API calls
   */
  private extractTokenFromCookies(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      // Try to get token from a meta tag set by the server
      const metaToken = document.querySelector('meta[name="auth-token"]');
      if (metaToken && metaToken.getAttribute('content')) {
        console.log("Found auth token in meta tag");
        return metaToken.getAttribute('content');
      }

      // Fallback: Check if cookies are accessible (they shouldn't be if HTTP-only)
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('authToken='));
      
      if (cookieValue) {
        console.log("Found auth token in accessible cookies");
        return cookieValue.split('=')[1];
      }

      console.log("No auth token found in meta tag or accessible cookies");
      return null;
    } catch (error) {
      console.error("Error extracting token from cookies:", error);
      return null;
    }
  }

  private getAuthToken(): string | null {
    console.log("=== getAuthToken DEBUG ===");
    
    // Try server-side token first (for server-side requests)
    console.log("Server auth token:", this.serverAuthToken ? "SET" : "NOT SET");
    if (this.serverAuthToken) {
      console.log("Using server auth token");
      return this.serverAuthToken;
    }
    
    // Check if we're in browser environment
    const inBrowser = typeof window !== 'undefined';
    console.log("In browser environment:", inBrowser);
    
    if (!inBrowser) {
      console.log("Not in browser, returning null");
      return null;
    }
    
    // Security: Try to get token from secure storage first
    let localToken = this.getSecureToken();
    console.log("Secure storage token:", localToken ? "FOUND" : "NOT FOUND");
    
    // Fallback: Check localStorage (legacy)
    if (!localToken) {
      localToken = localStorage.getItem('authToken');
      console.log("Legacy localStorage token:", localToken ? "FOUND" : "NOT FOUND");
      
      // If found in legacy storage, migrate to secure storage
      if (localToken) {
        console.log("🔄 Migrating token to secure storage...");
        this.setSecureToken(localToken);
        localStorage.removeItem('authToken'); // Remove from insecure storage
      }
    }
    
    // If no token in localStorage, try to extract from cookies/meta tags
    if (!localToken) {
      console.log("No stored token, checking cookies/meta tags...");
      localToken = this.extractTokenFromCookies();
      
      if (localToken) {
        console.log("Found token from cookies/meta, storing securely for future use");
        this.setSecureToken(localToken);
      } else {
        console.log("No token found anywhere");
      }
    }
    
    // Security: Validate token if found
    if (localToken) {
      if (TokenSecurity.isTokenExpired(localToken)) {
        console.warn("🚨 Token expired, clearing storage");
        this.clearAuthToken();
        return null;
      }
      
      console.log("✅ Valid token found (first 20 chars):", localToken.substring(0, 20) + "...");
      
      // Extract user ID from token if we don't have it yet
      if (!this.currentUserHashedId) {
        console.log("Extracting user ID from token...");
        this.extractUserIdFromToken(localToken);
        console.log("User ID after extraction:", this.currentUserHashedId || "FAILED TO EXTRACT");
      }
    }
    
    console.log("=== getAuthToken RESULT:", localToken ? "RETURNING TOKEN" : "RETURNING NULL");
    return localToken;
  }

  private setAuthToken(token: string): void {
    console.log("🔒 Setting auth token securely...");
    if (typeof window !== 'undefined') {
      this.setSecureToken(token);
      // Also extract user ID for future requests
      this.extractUserIdFromToken(token);
      
      // Clear any legacy storage
      localStorage.removeItem('authToken');
    }
  }

  private clearAuthToken(): void {
    console.log("🗑️ Clearing all auth tokens...");
    if (typeof window !== 'undefined') {
      this.clearSecureToken();
      localStorage.removeItem('authToken'); // Also clear legacy storage
    }
  }

  // New secure token storage methods
  private setSecureToken(token: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Security: Encrypt token before storage
      const encryptedToken = TokenSecurity.encrypt(token);
      
      // Security: Store with fingerprint for validation
      const secureData = {
        token: encryptedToken,
        fingerprint: this.fingerprint.getFingerprint(),
        timestamp: Date.now()
      };
      
      // Use sessionStorage for more security (cleared when tab closes)
      sessionStorage.setItem('zen_secure_auth', JSON.stringify(secureData));
      
      console.log("✅ Token stored securely with encryption and fingerprint");
      
      // SECURITY: Clear any existing localStorage token
      localStorage.removeItem('authToken');
      
    } catch (error) {
      console.error("❌ CRITICAL: Failed to store token securely:", error);
      
      // Log security event for failed encryption
      securityMonitor.logEvent({
        type: 'SUSPICIOUS_REQUEST',
        timestamp: Date.now(),
        details: { 
          error: 'Failed to encrypt and store token securely',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        },
        severity: 'HIGH'
      });
      
      // SECURITY: Do NOT fallback to localStorage - fail securely
      throw new Error('Unable to store authentication token securely');
    }
  }

  private getSecureToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Log token access for monitoring
    securityMonitor.logEvent({
      type: 'TOKEN_ACCESS',
      timestamp: Date.now(),
      details: { method: 'getSecureToken', userAgent: navigator.userAgent.substring(0, 50) },
      severity: 'LOW'
    });
    
    try {
      const secureDataStr = sessionStorage.getItem('zen_secure_auth');
      if (!secureDataStr) {
        console.log("🔍 No secure token found");
        return null;
      }
      
      const secureData = JSON.parse(secureDataStr);
      
      // Security: Validate fingerprint
      if (!this.fingerprint.validateFingerprint(secureData.fingerprint)) {
        console.warn("🚨 SECURITY ALERT: Fingerprint mismatch! Clearing token.");
        
        // Log security event
        securityMonitor.logEvent({
          type: 'FINGERPRINT_MISMATCH',
          timestamp: Date.now(),
          details: { 
            storedFingerprint: secureData.fingerprint,
            currentFingerprint: this.fingerprint.getFingerprint(),
            userAgent: navigator.userAgent
          },
          severity: 'CRITICAL'
        });
        
        this.clearSecureToken();
        return null;
      }
      
      // Security: Check token age (max 24 hours in storage)
      const tokenAge = Date.now() - secureData.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (tokenAge > maxAge) {
        console.warn("⏰ Token too old in storage, clearing");
        
        securityMonitor.logEvent({
          type: 'TOKEN_EXPIRY',
          timestamp: Date.now(),
          details: { reason: 'storage_age_exceeded', ageHours: tokenAge / (60 * 60 * 1000) },
          severity: 'MEDIUM'
        });
        
        this.clearSecureToken();
        return null;
      }
      
      // Security: Decrypt token
      const decryptedToken = TokenSecurity.decrypt(secureData.token);
      
      // Check if token is expired
      if (TokenSecurity.isTokenExpired(decryptedToken)) {
        securityMonitor.logEvent({
          type: 'TOKEN_EXPIRY',
          timestamp: Date.now(),
          details: { reason: 'jwt_expired' },
          severity: 'MEDIUM'
        });
        
        this.clearSecureToken();
        return null;
      }
      
      console.log("✅ Secure token retrieved and validated");
      return decryptedToken;
      
    } catch (error) {
      console.error("❌ Failed to retrieve secure token:", error);
      
      securityMonitor.logEvent({
        type: 'SUSPICIOUS_REQUEST',
        timestamp: Date.now(),
        details: { error: error instanceof Error ? error.message : 'Unknown error', method: 'getSecureToken' },
        severity: 'HIGH'
      });
      
      this.clearSecureToken();
      return null;
    }
  }

  private clearSecureToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('zen_secure_auth');
      console.log("🗑️ Secure token cleared");
    }
  }

  private getTempToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('tempToken') : null;
  }

  private setTempToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tempToken', token);
    }
  }

  private clearTempToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tempToken');
    }
  }

  // NEW: CSRF token management
  private loadCSRFToken(): void {
    if (typeof window === 'undefined') return;
    
    // Try to get CSRF token from meta tag or previous response
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (metaToken) {
      this.csrfToken = metaToken;
      console.log("🛡️ CSRF token loaded from meta tag");
    }
  }

  public setCSRFToken(token: string): void {
    this.csrfToken = token;
    console.log("🛡️ CSRF token updated");
  }

  public getCSRFToken(): string | undefined {
    return this.csrfToken;
  }

  // Generic API methods
  public async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    console.log("=== GET REQUEST START ===");
    console.log("Endpoint:", endpoint);
    console.log("Full URL:", `${this.axiosInstance.defaults.baseURL}${endpoint}`);
    
    return this.handleRequest(this.axiosInstance.get<BackendResponse<T>>(endpoint));
  }

  public async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    console.log("=== POST REQUEST ===");
    console.log("Endpoint:", endpoint);
    console.log("Data:", data);
    console.log("Full URL:", `${this.axiosInstance.defaults.baseURL}${endpoint}`);
    
    return this.handleRequest(this.axiosInstance.post<BackendResponse<T>>(endpoint, data));
  }

  public async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.handleRequest(this.axiosInstance.put<BackendResponse<T>>(endpoint, data));
  }

  public async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    console.log("=== PATCH REQUEST START ===");
    console.log("Endpoint:", endpoint);
    console.log("Data:", data);
    console.log("Full URL:", `${this.axiosInstance.defaults.baseURL}${endpoint}`);
    console.log("Auth token available:", !!this.getAuthToken());
    console.log("Current user hashed ID:", this.currentUserHashedId || "NOT SET");
    
    return this.handleRequest(this.axiosInstance.patch<BackendResponse<T>>(endpoint, data));
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.handleRequest(this.axiosInstance.delete<BackendResponse<T>>(endpoint));
  }

  // Authentication methods
  public async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    console.log("=== APIUtil.login START ===");
    console.log("Username:", credentials.username);
    
    try {
      const response = await this.handleRequest<LoginResponse>(
        this.axiosInstance.post(`${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, credentials)
      );
      
      if (response.success && response.data?.token) {
        this.setAuthToken(response.data.token);
        console.log("Login successful, token stored");
      }
      
      return response;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  public async checkUserMfaStatus(username: string): Promise<ApiResponse<CheckUserResponse>> {
    console.log("=== APIUtil.checkUserMfaStatus START ===");
    console.log("Username:", username);
    
    // Backend doesn't have dedicated check user endpoint, use auth config
    return this.handleRequest(
      this.axiosInstance.get(`${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.AUTH.CONFIG}`)
    );
  }

  public async initiateMfaSetup(username: string): Promise<ApiResponse<MfaSetupResponse>> {
    console.log("=== APIUtil.initiateMfaSetup START ===");
    console.log("Username:", username);
    
    return this.handleRequest(
      this.axiosInstance.get(`${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.AUTH.MFA_SETUP}?username=${username}`)
    );
  }

  public async verifyMfaSetup(username: string, password: string, mfaCode: string): Promise<ApiResponse<LoginResponse>> {
    console.log("=== APIUtil.verifyMfaSetup START ===");
    
    return this.handleRequest(
      this.axiosInstance.post(`${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.AUTH.MFA_VERIFY}`, {
        username,
        password,
        mfaCode
      })
    );
  }

  public async enableMfa(mfaCode: string): Promise<ApiResponse<LoginResponse>> {
    console.log("=== APIUtil.enableMfa START ===");
    
    return this.handleRequest(
      this.axiosInstance.post(`${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.AUTH.MFA_SETUP}`, {
        mfaCode
      })
    );
  }

  public async verifyMfa(mfaCode: string): Promise<ApiResponse<LoginResponse>> {
    console.log("=== APIUtil.verifyMfa START ===");
    
    return this.handleRequest(
      this.axiosInstance.post(`${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.AUTH.MFA_VERIFY}`, {
        mfaCode
      })
    );
  }

  public async logout(): Promise<ApiResponse<void>> {
    console.log("=== APIUtil.logout START ===");
    
    try {
      // Call backend logout endpoint
      const response = await this.handleRequest<void>(
        this.axiosInstance.post(`${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.AUTH.LOGOUT}`)
      );
      
      // Clear local tokens regardless of backend response
      this.clearAuthToken();
      this.clearTempToken();
      this.clearServerAuthToken();
      
      console.log("=== APIUtil.logout END ===");
      return response;
    } catch (error) {
      // Even if backend logout fails, clear local session
      console.error("Backend logout failed, clearing local session:", error);
      this.clearAuthToken();
      this.clearTempToken();
      this.clearServerAuthToken();
      
      return { success: true }; // Return success since local logout succeeded
    }
  }

  public async refreshToken(): Promise<ApiResponse<LoginResponse>> {
    return this.handleRequest(
      this.axiosInstance.post(`${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`)
    );
  }

  public isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  public hasTempToken(): boolean {
    return !!this.getTempToken();
  }

  // User Management API methods
  
  /**
   * Get users with pagination - follows backend standard from API_PAGINATION_EXAMPLES.md
   */
  public async getUsers(page: number = 1, size: number = 20, sortBy: string = 'createdAt', sortDir: 'asc' | 'desc' = 'desc'): Promise<ApiResponse<{content: User[], totalElements: number, number: number, totalPages: number, size: number}>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection: sortDir,
      includeGroupCount: 'false'
    });
    
    return this.handleRequest(
      this.axiosInstance.get(`${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.USERS.LIST}?${params.toString()}`)
    );
  }

  /**
   * Search users with pagination - follows backend standard from API_PAGINATION_EXAMPLES.md
   */
  public async searchUsers(searchQuery: string, page: number = 1, size: number = 20, sortBy: string = 'userCode', sortDir: 'asc' | 'desc' = 'asc'): Promise<ApiResponse<{users: User[], total: number, page: number, totalPages: number, pageSize: number}>> {
    console.log("=== APIUtil.searchUsers START ===");
    console.log("Search params:", { searchQuery, page, size, sortBy, sortDir });
    
    // Build query parameters following backend standard
    const params = new URLSearchParams();
    params.append('q', searchQuery); // Backend uses 'q' for search query
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sortBy', sortBy);
    params.append('sortDir', sortDir);
    
    const endpoint = `${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.USERS.SEARCH}?${params.toString()}`;
    console.log("Search endpoint:", endpoint);
    
    const response = await this.get<{users: User[], total: number, page: number, totalPages: number, pageSize: number}>(endpoint);
    console.log("=== APIUtil.searchUsers END ===");
    return response;
  }

  /**
   * Flexible search users with advanced criteria - follows FLEXIBLE_SEARCH_ARCHITECTURE.md
   * Updated to align with backend named parameter implementation from NAMED_PARAMETER_FIX_SUMMARY.md
   */
  public async searchUsersFlexible(queryString: string): Promise<ApiResponse<any>> {
    const endpoint = `${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.USERS.SEARCH}?${queryString}`;
    console.log("=== APIUtil.searchUsersFlexible ===");
    console.log("Full endpoint URL:", endpoint);
    console.log("Query string:", queryString);
    console.log("Base URL:", this.axiosInstance.defaults.baseURL);
    console.log("Complete URL:", `${this.axiosInstance.defaults.baseURL}${endpoint}`);
    
    return this.handleRequest(
      this.axiosInstance.get(endpoint)
    );
  }

  /**
   * Get all users (legacy method for backward compatibility) - uses basic endpoint
   */
  public async getAllUsers(): Promise<ApiResponse<User[]>> {
    console.log("=== APIUtil.getAllUsers START ===");
    const response = await this.get<User[]>("/users");
    console.log("=== APIUtil.getAllUsers END ===");
    return response;
  }

  /**
   * Get all users using explicit list endpoint - for backward compatibility
   */
  public async getAllUsersList(): Promise<ApiResponse<User[]>> {
    console.log("=== APIUtil.getAllUsersList START ===");
    const response = await this.get<User[]>("/users/list");
    console.log("=== APIUtil.getAllUsersList END ===");
    return response;
  }

  /**
   * Get user by hashed user ID - uses new explicit endpoint path
   */
  public async getUserById(encryptedUserId: string): Promise<ApiResponse<User>> {
    return this.handleRequest(
      this.axiosInstance.get(`${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.USERS.GET_BY_ID}/${encryptedUserId}`)
    );
  }

  /**
   * Get user by user code - uses new explicit endpoint path
   */
  public async getUserByCode(userCode: string): Promise<ApiResponse<User>> {
    return this.handleRequest(
      this.axiosInstance.get(`${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.USERS.GET_BY_CODE}/${userCode}`)
    );
  }

  /**
   * Create a new user - endpoint remains the same
   */
  public async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    return this.handleRequest(
      this.axiosInstance.post(`${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.USERS.CREATE}`, userData)
    );
  }

  /**
   * Update an existing user - uses new explicit endpoint path
   */
  public async updateUser(encryptedUserId: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    return this.handleRequest(
      this.axiosInstance.put(`${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.USERS.UPDATE}/${encryptedUserId}`, userData)
    );
  }

  /**
   * Delete a user - uses new explicit endpoint path
   */
  public async deleteUser(encryptedUserId: string): Promise<ApiResponse<void>> {
    return this.handleRequest(
      this.axiosInstance.delete(`${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.USERS.DELETE}/${encryptedUserId}`)
    );
  }

  /**
   * Toggle user status between Active and Inactive
   */
  public async toggleUserStatus(encryptedUserId: string): Promise<ApiResponse<{ success: boolean; message: string; newStatus: string }>> {
    console.log("=== APIUtil.toggleUserStatus START ===");
    console.log("Encrypted User ID:", encryptedUserId);
    console.log("API_CONFIG.API_PREFIX:", API_CONFIG.API_PREFIX);
    console.log("API_CONFIG.ENDPOINTS.USERS.TOGGLE_STATUS:", API_CONFIG.ENDPOINTS.USERS.TOGGLE_STATUS);
    
    const endpoint = `${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.USERS.TOGGLE_STATUS}/${encryptedUserId}/toggle-status`;
    console.log("Toggle status endpoint:", endpoint);
    console.log("Full URL:", `${this.axiosInstance.defaults.baseURL}${endpoint}`);
    console.log("Current user hashed ID for X-Current-User header:", this.currentUserHashedId);
    
    try {
      
      const response = await this.patch<{ success: boolean; message: string; newStatus: string }>(endpoint);
      
      console.log("Toggle status response:", response);
      console.log("=== APIUtil.toggleUserStatus END ===");
      return response;
    } catch (error) {
      console.error("=== APIUtil.toggleUserStatus ERROR ===", error);
      
      // Log more details about the error
      if (error && typeof error === 'object') {
        console.error("Error message:", (error as any).message);
        console.error("Error response:", (error as any).response);
        console.error("Error config:", (error as any).config);
        console.error("Error status:", (error as any).response?.status);
        console.error("Error data:", (error as any).response?.data);
      }
      
      throw error;
    }
  }

  /**
   * Update user session validity - uses new explicit endpoint path
   */
  public async updateUserSessionValidity(hashedUserId: string, sessionData: SessionValidityRequest): Promise<ApiResponse<SessionValidityResponse>> {
    console.log("=== APIUtil.updateUserSessionValidity START ===");
    console.log("Hashed User ID:", hashedUserId);
    console.log("Session data:", sessionData);
    const response = await this.put<SessionValidityResponse>(`/users/updateSessionValidity/${hashedUserId}`, sessionData);
    console.log("=== APIUtil.updateUserSessionValidity END ===");
    return response;
  }

  /**
   * Get user approval requests - uses new explicit endpoint path
   */
  public async getUserApprovalRequests(hashedUserId: string): Promise<ApiResponse<any[]>> {
    console.log("=== APIUtil.getUserApprovalRequests START ===");
    console.log("Hashed User ID:", hashedUserId);
    const response = await this.get<any[]>(`/users/getApprovalRequests/${hashedUserId}`);
    console.log("=== APIUtil.getUserApprovalRequests END ===");
    return response;
  }

  /**
   * Reset user password - sends reset password request
   */
  public async resetUserPassword(encryptedUserId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    console.log("=== APIUtil.resetUserPassword START ===");
    console.log("Encrypted User ID:", encryptedUserId);
    
    const endpoint = `${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.USERS.RESET_PASSWORD}/${encryptedUserId}/reset-password`;
    console.log("Reset password endpoint:", endpoint);
    
    try {
      const response = await this.patch<{ success: boolean; message: string }>(endpoint);
      console.log("Reset password response:", response);
      console.log("=== APIUtil.resetUserPassword END ===");
      return response;
    } catch (error) {
      console.error("=== APIUtil.resetUserPassword ERROR ===", error);
      throw error;
    }
  }

  /**
   * Reset user MFA - sends reset MFA request
   */
  public async resetUserMFA(encryptedUserId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    console.log("=== APIUtil.resetUserMFA START ===");
    console.log("Encrypted User ID:", encryptedUserId);
    
    const endpoint = `${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.USERS.RESET_MFA}/${encryptedUserId}/reset-mfa`;
    console.log("Reset MFA endpoint:", endpoint);
    
    try {
      const response = await this.patch<{ success: boolean; message: string }>(endpoint);
      console.log("Reset MFA response:", response);
      console.log("=== APIUtil.resetUserMFA END ===");
      return response;
    } catch (error) {
      console.error("=== APIUtil.resetUserMFA ERROR ===", error);
      throw error;
    }
  }

  /**
   * Toggle user MFA enable/disable
   */
  public async toggleUserMFA(encryptedUserId: string, enabled: boolean): Promise<ApiResponse<{ success: boolean; message: string; enabled: boolean }>> {
    console.log("=== APIUtil.toggleUserMFA START ===");
    console.log("Encrypted User ID:", encryptedUserId);
    console.log("Enabled:", enabled);
    
    const endpoint = `${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.USERS.TOGGLE_MFA}/${encryptedUserId}/toggle-mfa?enabled=${enabled}`;
    console.log("Toggle MFA endpoint:", endpoint);
    
    try {
      const response = await this.patch<{ success: boolean; message: string; enabled: boolean }>(endpoint);
      console.log("Toggle MFA response:", response);
      console.log("=== APIUtil.toggleUserMFA END ===");
      return response;
    } catch (error) {
      console.error("=== APIUtil.toggleUserMFA ERROR ===", error);
      throw error;
    }
  }

  /**
   * Get user security status
   */
  public async getUserSecurityStatus(encryptedUserId: string): Promise<ApiResponse<{
    encryptedUserId: string;
    username: string;
    password: {
      hasPassword: boolean;
      lastUpdated: string;
    };
    mfa: {
      enabled: boolean;
      enforced: boolean;
      hasSecret: boolean;
      hasRecoveryCodes: boolean;
      setupRequired: boolean;
    };
    recordStatus: string;
    lastLoginAt: string;
    createdAt: string;
  }>> {
    console.log("=== APIUtil.getUserSecurityStatus START ===");
    console.log("Encrypted User ID:", encryptedUserId);
    
    const endpoint = `${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.USERS.SECURITY_STATUS}/${encryptedUserId}/security-status`;
    console.log("Security status endpoint:", endpoint);
    
    try {
      const response = await this.get<{
        encryptedUserId: string;
        username: string;
        password: {
          hasPassword: boolean;
          lastUpdated: string;
        };
        mfa: {
          enabled: boolean;
          enforced: boolean;
          hasSecret: boolean;
          hasRecoveryCodes: boolean;
          setupRequired: boolean;
        };
        recordStatus: string;
        lastLoginAt: string;
        createdAt: string;
      }>(endpoint);
      console.log("Security status response:", response);
      console.log("=== APIUtil.getUserSecurityStatus END ===");
      return response;
    } catch (error) {
      console.error("=== APIUtil.getUserSecurityStatus ERROR ===", error);
      throw error;
    }
  }

  private performSecurityMigration(): void {
    if (typeof window === 'undefined') return;
    
    console.log("🔄 Performing security migration...");
    
    try {
      // Check for existing localStorage token
      const existingToken = localStorage.getItem('authToken');
      
      if (existingToken) {
        console.log("🔍 Found existing localStorage token, validating...");
        
        // Check if token is still valid
        if (!TokenSecurity.isTokenExpired(existingToken)) {
          console.log("✅ Token is valid, migrating to secure storage...");
          
          // Migrate to secure storage
          this.setSecureToken(existingToken);
          
          // Log migration event
          securityMonitor.logEvent({
            type: 'DEVICE_CHANGE',
            timestamp: Date.now(),
            details: { 
              action: 'token_migration_completed',
              from: 'localStorage',
              to: 'sessionStorage_encrypted'
            },
            severity: 'MEDIUM'
          });
          
          console.log("✅ Migration completed successfully");
        } else {
          console.log("⏰ Token expired, discarding...");
          
          securityMonitor.logEvent({
            type: 'TOKEN_EXPIRY',
            timestamp: Date.now(),
            details: { reason: 'expired_during_migration' },
            severity: 'LOW'
          });
        }
      }
      
      // SECURITY: Always clear localStorage tokens regardless
      localStorage.removeItem('authToken');
      console.log("🗑️ Cleared localStorage authToken");
      
      // Clear any other potential security risks
      const securityKeys = ['tempToken', 'auth_token', 'access_token', 'bearer_token'];
      securityKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`🗑️ Cleared potentially insecure key: ${key}`);
        }
      });
      
      console.log("✅ Security migration completed");
      
    } catch (error) {
      console.error("❌ Security migration failed:", error);
      
      // On migration failure, clear everything for security
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('zen_secure_auth');
      
      securityMonitor.logEvent({
        type: 'SUSPICIOUS_REQUEST',
        timestamp: Date.now(),
        details: { 
          error: 'Security migration failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        },
        severity: 'HIGH'
      });
    }
  }

  /**
   * Manual security cleanup - clears all authentication data
   * Can be called from browser console for immediate cleanup
   */
  public forceSecurityCleanup(): void {
    console.log("🚨 FORCE SECURITY CLEANUP INITIATED");
    
    if (typeof window !== 'undefined') {
      // Clear all localStorage items
      ['authToken', 'tempToken', 'auth_token', 'access_token', 'bearer_token'].forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Cleared localStorage: ${key}`);
      });
      
      // Clear secure sessionStorage
      sessionStorage.removeItem('zen_secure_auth');
      console.log("🗑️ Cleared secure sessionStorage");
      
      // Clear instance tokens
      this.clearServerAuthToken();
      this.currentUserHashedId = undefined;
      
      // Log security event
      securityMonitor.logEvent({
        type: 'DEVICE_CHANGE',
        timestamp: Date.now(),
        details: { action: 'force_security_cleanup' },
        severity: 'HIGH'
      });
      
      console.log("✅ FORCE SECURITY CLEANUP COMPLETED");
      console.log("ℹ️ You may need to refresh the page and re-login");
    }
  }
}