/**
 * Secure API Utility - uses server-side proxy to hide tokens from browser
 * 
 * This utility routes API calls through Remix server-side routes,
 * completely hiding authentication tokens from browser network inspection.
 */

export interface SecureApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class SecureApiUtil {
  private static instance: SecureApiUtil;

  private constructor() {}

  public static getInstance(): SecureApiUtil {
    if (!SecureApiUtil.instance) {
      SecureApiUtil.instance = new SecureApiUtil();
    }
    return SecureApiUtil.instance;
  }

  /**
   * Make a secure API call through server-side proxy
   * Browser will only see calls to /api/proxy - no tokens exposed!
   */
  private async makeSecureCall<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    data?: any
  ): Promise<SecureApiResponse<T>> {
    try {
      console.log(`🔒 Secure API call: ${method} ${endpoint}`);

      let response: Response;

      if (method === 'GET') {
        // Use query parameters for GET requests
        const params = new URLSearchParams({
          endpoint,
          method
        });
        response = await fetch(`/api/proxy?${params.toString()}`);
      } else {
        // Use POST body for other methods
        response = await fetch('/api/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint,
            method,
            data
          })
        });
      }

      const result = await response.json();
      console.log(`✅ Secure API response:`, result);
      
      return result;
    } catch (error) {
      console.error(`❌ Secure API error for ${method} ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // User Management Methods (Secure)
  async toggleUserStatus(userId: string): Promise<SecureApiResponse<{ success: boolean; message: string; newStatus: string }>> {
    return this.makeSecureCall(`/users/${userId}/toggle-status`, 'PATCH');
  }

  async resetUserPassword(userId: string): Promise<SecureApiResponse<{ success: boolean; message: string }>> {
    return this.makeSecureCall(`/users/${userId}/reset-password`, 'PATCH');
  }

  async resetUserMFA(userId: string): Promise<SecureApiResponse<{ success: boolean; message: string }>> {
    return this.makeSecureCall(`/users/${userId}/reset-mfa`, 'PATCH');
  }

  async toggleUserMFA(userId: string, enabled: boolean): Promise<SecureApiResponse<{ success: boolean; message: string; enabled: boolean }>> {
    return this.makeSecureCall(`/users/${userId}/toggle-mfa`, 'PATCH', { enabled });
  }

  async getUserSecurityStatus(userId: string): Promise<SecureApiResponse<{
    encryptedUserId: string;
    username: string;
    password: { hasPassword: boolean; lastUpdated: string };
    mfa: { enabled: boolean; enforced: boolean; hasSecret: boolean; hasRecoveryCodes: boolean; setupRequired: boolean };
    recordStatus: string;
    lastLoginAt: string;
    createdAt: string;
  }>> {
    return this.makeSecureCall(`/users/${userId}/security-status`, 'GET');
  }

  async getUserById(userId: string): Promise<SecureApiResponse<any>> {
    return this.makeSecureCall(`/users/${userId}`, 'GET');
  }

  async updateUser(userId: string, userData: any): Promise<SecureApiResponse<any>> {
    return this.makeSecureCall(`/users/${userId}`, 'PUT', userData);
  }

  async getAllUsers(): Promise<SecureApiResponse<any[]>> {
    return this.makeSecureCall('/users', 'GET');
  }

  async createUser(userData: any): Promise<SecureApiResponse<any>> {
    return this.makeSecureCall('/users', 'POST', userData);
  }
}

// Export singleton instance
export const secureApi = SecureApiUtil.getInstance(); 