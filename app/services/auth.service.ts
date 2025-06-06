import { APIUtil, LoginRequest, LoginResponse, MfaSetupResponse, MfaVerifyResponse } from "~/utils/api.util";
import { AuthUser, AuthSession } from "~/models/auth-user.model";
import { GlobalAlertMessageHandler } from "~/utils/alert.util";

export type AuthState = 
  | 'unauthenticated'
  | 'authenticated'
  | 'mfa_required'
  | 'mfa_setup_required';

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  state?: AuthState;
  requireMfa?: boolean;
  mfaSetupRequired?: boolean;
}

export class AuthService {
  private static instance: AuthService;
  private apiUtil: APIUtil;
  private alertHandler: GlobalAlertMessageHandler;

  private constructor() {
    this.apiUtil = APIUtil.getInstance();
    this.alertHandler = GlobalAlertMessageHandler.getInstance();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async login(credentials: LoginRequest): Promise<AuthResult> {
    try {
      const response = await this.apiUtil.login(credentials);

      if (response.success && response.data) {
        const data = response.data;

        // Scenario 1: Fresh user (no MFA) - gets token immediately
        if (data.token && data.user) {
          this.alertHandler.success("Login successful!", "Welcome back");
          return {
            success: true,
            user: data.user,
            state: 'authenticated',
          };
        }

        // Scenario 2: User needs MFA setup
        if (data.requireMfaSetup && data.tempToken) {
          this.alertHandler.info("MFA setup required", "Please set up two-factor authentication");
          return {
            success: true,
            state: 'mfa_setup_required',
            mfaSetupRequired: true,
          };
        }

        // Scenario 3: User with MFA enabled - needs MFA verification
        if (data.requireMfa && data.tempToken) {
          this.alertHandler.info("MFA verification required", "Please enter your authentication code");
          return {
            success: true,
            state: 'mfa_required',
            requireMfa: true,
          };
        }

        // Fallback for unexpected response
        const errorMessage = "Unexpected login response";
        this.alertHandler.error(errorMessage, "Login Failed");
        return {
          success: false,
          error: errorMessage,
          state: 'unauthenticated',
        };
      } else {
        const errorMessage = response.error || "Login failed";
        this.alertHandler.error(errorMessage, "Login Failed");
        return {
          success: false,
          error: errorMessage,
          state: 'unauthenticated',
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred during login";
      this.alertHandler.error(errorMessage, "Login Error");
      return {
        success: false,
        error: errorMessage,
        state: 'unauthenticated',
      };
    }
  }

  // Scenario 2: MFA Setup Flow
  public async initiateMfaSetup(username: string): Promise<{ success: boolean; data?: MfaSetupResponse; error?: string }> {
    try {
      const response = await this.apiUtil.initiateMfaSetup(username);

      if (response.success && response.data) {
        this.alertHandler.info("MFA setup initiated", "Scan the QR code with your authenticator app");
        return {
          success: true,
          data: response.data,
        };
      } else {
        const errorMessage = response.error || "Failed to initiate MFA setup";
        this.alertHandler.error(errorMessage, "MFA Setup Failed");
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred during MFA setup";
      this.alertHandler.error(errorMessage, "MFA Setup Error");
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  public async enableMfa(mfaCode: string): Promise<AuthResult> {
    try {
      const response = await this.apiUtil.enableMfa(mfaCode);

      if (response.success && response.data) {
        this.alertHandler.success("MFA enabled successfully!", "Your account is now more secure");
        return {
          success: true,
          user: response.data.user,
          state: 'authenticated',
        };
      } else {
        const errorMessage = response.error || "Failed to enable MFA";
        this.alertHandler.error(errorMessage, "MFA Enable Failed");
        return {
          success: false,
          error: errorMessage,
          state: 'mfa_setup_required',
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while enabling MFA";
      this.alertHandler.error(errorMessage, "MFA Enable Error");
      return {
        success: false,
        error: errorMessage,
        state: 'mfa_setup_required',
      };
    }
  }

  // Scenario 3: MFA Verification Flow
  public async verifyMfa(mfaCode: string): Promise<AuthResult> {
    try {
      const response = await this.apiUtil.verifyMfa(mfaCode);

      if (response.success && response.data) {
        this.alertHandler.success("MFA verification successful!", "Welcome back");
        return {
          success: true,
          user: response.data.user,
          state: 'authenticated',
        };
      } else {
        const errorMessage = response.error || "MFA verification failed";
        this.alertHandler.error(errorMessage, "MFA Verification Failed");
        return {
          success: false,
          error: errorMessage,
          state: 'mfa_required',
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred during MFA verification";
      this.alertHandler.error(errorMessage, "MFA Verification Error");
      return {
        success: false,
        error: errorMessage,
        state: 'mfa_required',
      };
    }
  }

  public async logout(): Promise<void> {
    console.log("=== AuthService.logout START ===");
    
    try {
      const response = await this.apiUtil.logout();
      
      if (response.success) {
        this.alertHandler.success("You have been logged out successfully", "Goodbye!");
        console.log("=== AuthService.logout SUCCESS ===");
      } else {
        this.alertHandler.warning("Logged out locally, but server logout may have failed", "Logout");
        console.warn("Server logout failed but continuing with local logout");
      }
    } catch (error) {
      // Even if logout fails on server, clear local session
      console.error("Logout error:", error);
      this.alertHandler.warning("Logged out locally, but server logout may have failed", "Logout");
    }
    
    console.log("=== AuthService.logout END ===");
  }

  public async refreshToken(): Promise<{ success: boolean; user?: AuthUser }> {
    try {
      const response = await this.apiUtil.refreshToken();
      
      if (response.success && response.data) {
        return {
          success: true,
          user: response.data.user,
        };
      }
      
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  }

  public isAuthenticated(): boolean {
    return this.apiUtil.isAuthenticated();
  }

  public hasTempToken(): boolean {
    return this.apiUtil.hasTempToken();
  }

  public getAuthState(): AuthState {
    if (this.isAuthenticated()) {
      return 'authenticated';
    }
    
    if (this.hasTempToken()) {
      // This would need to be determined based on the login response
      // For now, we'll assume it's MFA required
      return 'mfa_required';
    }
    
    return 'unauthenticated';
  }

  public async validateSession(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    // Try to refresh token to validate session
    const result = await this.refreshToken();
    return result.success;
  }
} 