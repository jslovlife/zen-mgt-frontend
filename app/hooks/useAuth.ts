import { useState, useEffect } from "react";
import { AuthService, AuthState, AuthResult } from "~/services/auth.service";
import { AuthUser } from "~/models/auth-user.model";
import { LoginRequest, MfaSetupResponse } from "~/utils/api.util";

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authState: AuthState;
  login: (credentials: LoginRequest) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  // MFA methods
  initiateMfaSetup: (username: string) => Promise<{ success: boolean; data?: MfaSetupResponse; error?: string }>;
  enableMfa: (mfaCode: string) => Promise<AuthResult>;
  verifyMfa: (mfaCode: string) => Promise<AuthResult>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>('unauthenticated');
  const authService = AuthService.getInstance();

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = async () => {
      setIsLoading(true);
      
      const currentState = authService.getAuthState();
      setAuthState(currentState);
      
      if (authService.isAuthenticated()) {
        // Try to validate and refresh session
        const isValid = await authService.validateSession();
        if (!isValid) {
          setUser(null);
          setAuthState('unauthenticated');
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [authService]);

  const login = async (credentials: LoginRequest): Promise<AuthResult> => {
    setIsLoading(true);
    
    try {
      const result = await authService.login(credentials);
      
      if (result.success) {
        if (result.user) {
          setUser(result.user);
        }
        setAuthState(result.state || 'unauthenticated');
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      await authService.logout();
      setUser(null);
      setAuthState('unauthenticated');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    if (!authService.isAuthenticated()) {
      setUser(null);
      setAuthState('unauthenticated');
      return;
    }

    const result = await authService.refreshToken();
    if (result.success && result.user) {
      setUser(result.user);
      setAuthState('authenticated');
    } else {
      setUser(null);
      setAuthState('unauthenticated');
    }
  };

  // MFA Setup Methods (Scenario 2)
  const initiateMfaSetup = async (username: string) => {
    setIsLoading(true);
    
    try {
      const result = await authService.initiateMfaSetup(username);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const enableMfa = async (mfaCode: string): Promise<AuthResult> => {
    setIsLoading(true);
    
    try {
      const result = await authService.enableMfa(mfaCode);
      
      if (result.success && result.user) {
        setUser(result.user);
        setAuthState('authenticated');
      } else {
        setAuthState(result.state || 'mfa_setup_required');
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  // MFA Verification Method (Scenario 3)
  const verifyMfa = async (mfaCode: string): Promise<AuthResult> => {
    setIsLoading(true);
    
    try {
      const result = await authService.verifyMfa(mfaCode);
      
      if (result.success && result.user) {
        setUser(result.user);
        setAuthState('authenticated');
      } else {
        setAuthState(result.state || 'mfa_required');
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isAuthenticated: authState === 'authenticated',
    isLoading,
    authState,
    login,
    logout,
    refreshSession,
    initiateMfaSetup,
    enableMfa,
    verifyMfa,
  };
} 