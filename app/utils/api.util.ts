import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { API_CONFIG } from "~/config/api";
import type { User, CreateUserRequest, UpdateUserRequest, SessionValidityRequest, SessionValidityResponse } from "~/types/user.type";

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

export class APIUtil {
  private static instance: APIUtil;
  private axiosInstance: AxiosInstance;
  private serverAuthToken?: string;
  private currentUserHashedId?: string; // For X-Current-User header

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
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

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add X-Current-User header for operations that require it
        if (this.currentUserHashedId) {
          config.headers['X-Current-User'] = this.currentUserHashedId;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearAuthToken();
          this.clearTempToken();
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

  private getAuthToken(): string | null {
    // Try server-side token first (for server-side requests)
    if (this.serverAuthToken) {
      return this.serverAuthToken;
    }
    // Fall back to client-side storage
    return typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  }

  private setAuthToken(token: string): void {
    // In a real app, store in secure cookies
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  private clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
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
  public async deleteUser(encryptedUserId: string, reason?: string): Promise<ApiResponse<void>> {
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return this.handleRequest(
      this.axiosInstance.delete(`${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.USERS.DELETE}/${encryptedUserId}${params}`)
    );
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
} 