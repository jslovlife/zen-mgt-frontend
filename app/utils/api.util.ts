import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { API_CONFIG } from "~/config/api";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface LoginRequest {
  username: string; // Can be either email or username
  password: string;
  mfaCode?: string; // Optional MFA code for scenario 3
}

export interface LoginResponse {
  token?: string; // JWT token when login is successful
  user?: {
    id: number;
    email: string;
    name: string;
    role?: string;
    mfaEnabled?: boolean;
  };
  requireMfa?: boolean; // Indicates MFA verification is required
  requireMfaSetup?: boolean; // Indicates MFA setup is needed
  recoveryCodes?: string[]; // Recovery codes after MFA setup
  tempToken?: string; // Temporary token for MFA scenarios
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

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Handle common errors
        if (error.response?.status === 401) {
          this.clearAuthToken();
          this.clearTempToken();
          // Redirect to login if needed
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    // In a real app, get from secure storage/cookies
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
  private async handleRequest<T>(
    request: Promise<AxiosResponse<T>>
  ): Promise<ApiResponse<T>> {
    try {
      console.log("=== HTTP REQUEST START ===");
      const response = await request;
      console.log("=== HTTP REQUEST SUCCESS ===");
      console.log("Status:", response.status);
      console.log("Status Text:", response.statusText);
      console.log("Headers:", response.headers);
      console.log("Data:", response.data);
      
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.log("=== HTTP REQUEST ERROR ===");
      console.error("Request failed:", error);
      
      if (axios.isAxiosError(error)) {
        console.log("Axios Error Details:");
        console.log("- Status:", error.response?.status);
        console.log("- Status Text:", error.response?.statusText);
        console.log("- Headers:", error.response?.headers);
        console.log("- Data:", error.response?.data);
        console.log("- Message:", error.message);
        console.log("- Code:", error.code);
        console.log("- Config URL:", error.config?.url);
        console.log("- Config Method:", error.config?.method);
        console.log("- Config Data:", error.config?.data);
        
        return {
          success: false,
          error: error.response?.data?.message || error.response?.data?.error || error.message,
          status: error.response?.status,
        };
      }
      
      console.log("Non-Axios Error:", error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  public async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    console.log("=== GET REQUEST START ===");
    console.log("Endpoint:", endpoint);
    console.log("Full URL:", `${this.axiosInstance.defaults.baseURL}${endpoint}`);
    
    return this.handleRequest(this.axiosInstance.get<T>(endpoint));
  }

  public async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    console.log("=== POST REQUEST ===");
    console.log("Endpoint:", endpoint);
    console.log("Data:", data);
    console.log("Full URL:", `${this.axiosInstance.defaults.baseURL}${endpoint}`);
    
    return this.handleRequest(this.axiosInstance.post<T>(endpoint, data));
  }

  public async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.handleRequest(this.axiosInstance.put<T>(endpoint, data));
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.handleRequest(this.axiosInstance.delete<T>(endpoint));
  }

  // Authentication specific methods
  public async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    console.log("=== APIUtil.login START ===");
    console.log("API Base URL:", API_CONFIG.BASE_URL);
    console.log("Login endpoint:", API_CONFIG.ENDPOINTS.LOGIN);
    console.log("Full URL:", `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`);
    console.log("Credentials:", {
      username: credentials.username,
      password: "[REDACTED]",
      mfaCode: credentials.mfaCode || "none"
    });

    const response = await this.post<LoginResponse>(API_CONFIG.ENDPOINTS.LOGIN, credentials);
    
    console.log("=== APIUtil.login RESPONSE ===");
    console.log("Response success:", response.success);
    console.log("Response status:", response.status);
    console.log("Response error:", response.error);
    console.log("Response data:", response.data);
    
    if (response.success && response.data?.token) {
      console.log("Setting auth token");
      this.setAuthToken(response.data.token);
    }
    
    // Also handle temp token for MFA scenarios
    if (response.success && response.data?.tempToken) {
      console.log("Setting temp token for MFA flow");
      this.setTempToken(response.data.tempToken);
    }
    
    console.log("=== APIUtil.login END ===");
    return response;
  }

  // Check user MFA status before login
  public async checkUserMfaStatus(username: string): Promise<ApiResponse<CheckUserResponse>> {
    console.log("=== APIUtil.checkUserMfaStatus START ===");
    console.log("Username:", username);

    const response = await this.post<CheckUserResponse>(API_CONFIG.ENDPOINTS.CHECK_USER, {
      username
    });

    console.log("=== APIUtil.checkUserMfaStatus RESPONSE ===");
    console.log("Response success:", response.success);
    console.log("Response data:", response.data);

    return response;
  }

  // MFA Setup (Scenario 2) - Initialize setup
  public async initiateMfaSetup(username: string): Promise<ApiResponse<MfaSetupResponse>> {
    console.log("=== APIUtil.initiateMfaSetup START ===");
    console.log("Username:", username);
    console.log("MFA_SETUP_INIT endpoint:", API_CONFIG.ENDPOINTS.MFA_SETUP_INIT);
    
    const fullUrl = `${API_CONFIG.ENDPOINTS.MFA_SETUP_INIT}?username=${encodeURIComponent(username)}`;
    console.log("Full URL to call:", fullUrl);
    console.log("Base URL:", this.axiosInstance.defaults.baseURL);
    console.log("Complete URL:", `${this.axiosInstance.defaults.baseURL}${fullUrl}`);
    
    try {
      console.log("=== MAKING GET REQUEST ===");
      
      // Create a promise with timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout after 5 seconds'));
        }, 5000);
      });
      
      const requestPromise = this.get<MfaSetupResponse>(fullUrl);
      
      // Race between the request and timeout
      const response = await Promise.race([requestPromise, timeoutPromise]);
      
      console.log("=== APIUtil.initiateMfaSetup RESPONSE ===");
      console.log("Response success:", response.success);
      console.log("Response status:", response.status);
      console.log("Response error:", response.error);
      console.log("Response data:", response.data);
      
      return response;
    } catch (error) {
      console.log("=== APIUtil.initiateMfaSetup EXCEPTION ===");
      console.error("Exception in initiateMfaSetup:", error);
      
      let errorMessage = 'Failed to initiate MFA setup';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // MFA Setup (Scenario 2) - Verify and enable MFA
  public async verifyMfaSetup(username: string, password: string, mfaCode: string): Promise<ApiResponse<LoginResponse>> {
    console.log("=== APIUtil.verifyMfaSetup START ===");
    console.log("Username:", username);
    console.log("MFA Code:", mfaCode);

    const response = await this.post<LoginResponse>(API_CONFIG.ENDPOINTS.MFA_SETUP_VERIFY, {
      username,
      password,
      mfaCode
    });

    console.log("=== APIUtil.verifyMfaSetup RESPONSE ===");
    console.log("Response success:", response.success);
    console.log("Response data:", response.data);

    if (response.success && response.data?.token) {
      console.log("Setting auth token after MFA setup");
      this.setAuthToken(response.data.token);
    }

    return response;
  }

  public async logout(): Promise<ApiResponse<void>> {
    const response = await this.post<void>(API_CONFIG.ENDPOINTS.LOGOUT);
    this.clearAuthToken();
    this.clearTempToken();
    return response;
  }

  public async refreshToken(): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>(API_CONFIG.ENDPOINTS.REFRESH);
  }

  public isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  public hasTempToken(): boolean {
    return !!this.getTempToken();
  }
} 