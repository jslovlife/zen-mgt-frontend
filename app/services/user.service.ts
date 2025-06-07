import { APIUtil } from "~/utils/api.util";
import { User, CreateUserRequest, UpdateUserRequest, SessionValidityRequest, SessionValidityResponse } from "~/types/user.type";
import { GlobalAlertMessageHandler } from "~/utils/alert.util";
import { UserSearchCriteria, SearchServiceResult, SearchResponse, SearchUtils, USER_SEARCH_CONFIG } from "~/types/search.type";

export interface UserServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class UserService {
  private static instance: UserService;
  private apiUtil: APIUtil;
  private alertHandler: GlobalAlertMessageHandler;

  private constructor() {
    this.apiUtil = APIUtil.getInstance();
    this.alertHandler = GlobalAlertMessageHandler.getInstance();
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Set server-side auth token for API calls (used in loaders)
   */
  public setServerAuthToken(token: string): void {
    this.apiUtil.setServerAuthToken(token);
  }

  /**
   * Clear server-side auth token after API calls
   */
  public clearServerAuthToken(): void {
    this.apiUtil.clearServerAuthToken();
  }

  /**
   * Get users with pagination - follows backend standard from API_PAGINATION_EXAMPLES.md
   */
  public async getUsers(page: number = 1, size: number = 20, sortBy: string = 'userCode', sortDir: 'asc' | 'desc' = 'asc'): Promise<UserServiceResult<{users: User[], total: number, page: number, totalPages: number, pageSize: number}>> {
    try {
      console.log("=== UserService.getUsers START ===", { page, size, sortBy, sortDir });
      
      const response = await this.apiUtil.getUsers(page, size, sortBy, sortDir);
      
      if (response.success && response.data) {
        console.log("=== UserService.getUsers SUCCESS ===");
        return {
          success: true,
          data: response.data
        };
      } else {
        const errorMessage = response.error || "Failed to fetch users";
        console.error("UserService.getUsers failed:", errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while fetching users";
      console.error("UserService.getUsers exception:", error);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      console.log("=== UserService.getUsers END ===");
    }
  }

  /**
   * Get all users (legacy method for backward compatibility)
   */
  public async getAllUsers(): Promise<UserServiceResult<User[]>> {
    try {
      console.log("=== UserService.getAllUsers START ===");
      
      const response = await this.apiUtil.getAllUsers();
      
      if (response.success && response.data) {
        console.log("=== UserService.getAllUsers SUCCESS ===");
        return {
          success: true,
          data: response.data
        };
      } else {
        const errorMessage = response.error || "Failed to fetch all users";
        console.error("UserService.getAllUsers failed:", errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while fetching all users";
      console.error("UserService.getAllUsers exception:", error);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      console.log("=== UserService.getAllUsers END ===");
    }
  }

  /**
   * Get user by hashed user ID
   */
  public async getUserById(hashedUserId: string): Promise<UserServiceResult<User>> {
    try {
      console.log("=== UserService.getUserById START ===", { hashedUserId });
      
      const response = await this.apiUtil.getUserById(hashedUserId);
      
      if (response.success && response.data) {
        console.log("=== UserService.getUserById SUCCESS ===");
        return {
          success: true,
          data: response.data
        };
      } else {
        const errorMessage = response.error || "Failed to fetch user";
        console.error("UserService.getUserById failed:", errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while fetching user";
      console.error("UserService.getUserById exception:", error);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      console.log("=== UserService.getUserById END ===");
    }
  }

  /**
   * Get user by user code
   */
  public async getUserByCode(userCode: string): Promise<UserServiceResult<User>> {
    try {
      console.log("=== UserService.getUserByCode START ===", { userCode });
      
      const response = await this.apiUtil.getUserByCode(userCode);
      
      if (response.success && response.data) {
        console.log("=== UserService.getUserByCode SUCCESS ===");
        return {
          success: true,
          data: response.data
        };
      } else {
        const errorMessage = response.error || "Failed to fetch user by code";
        console.error("UserService.getUserByCode failed:", errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while fetching user by code";
      console.error("UserService.getUserByCode exception:", error);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      console.log("=== UserService.getUserByCode END ===");
    }
  }

  /**
   * Create a new user
   */
  public async createUser(userData: CreateUserRequest): Promise<UserServiceResult<User>> {
    try {
      console.log("=== UserService.createUser START ===");
      console.log("UserService instance APIUtil:", !!this.apiUtil);
      
      // Check if we have a server-side token before making the call
      const hasServerToken = (this.apiUtil as any).serverAuthToken;
      console.log("APIUtil has server auth token:", !!hasServerToken);
      if (hasServerToken) {
        console.log("Server token value (first 20 chars):", hasServerToken.substring(0, 20) + "...");
      }
      
      const response = await this.apiUtil.createUser(userData);
      
      if (response.success && response.data) {
        console.log("=== UserService.createUser SUCCESS ===");
        this.alertHandler.success("User created successfully!", "The new user has been added to the system");
        return {
          success: true,
          data: response.data
        };
      } else {
        const errorMessage = response.error || "Failed to create user";
        console.error("UserService.createUser failed:", errorMessage);
        this.alertHandler.error(errorMessage, "User Creation Failed");
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while creating user";
      console.error("UserService.createUser exception:", error);
      this.alertHandler.error(errorMessage, "User Creation Error");
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      console.log("=== UserService.createUser END ===");
    }
  }

  /**
   * Update an existing user
   */
  public async updateUser(hashedUserId: string, userData: UpdateUserRequest): Promise<UserServiceResult<User>> {
    try {
      console.log("=== UserService.updateUser START ===", { hashedUserId });
      
      const response = await this.apiUtil.updateUser(hashedUserId, userData);
      
      if (response.success && response.data) {
        console.log("=== UserService.updateUser SUCCESS ===");
        this.alertHandler.success("User updated successfully!", "The user information has been updated");
        return {
          success: true,
          data: response.data
        };
      } else {
        const errorMessage = response.error || "Failed to update user";
        console.error("UserService.updateUser failed:", errorMessage);
        this.alertHandler.error(errorMessage, "User Update Failed");
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while updating user";
      console.error("UserService.updateUser exception:", error);
      this.alertHandler.error(errorMessage, "User Update Error");
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      console.log("=== UserService.updateUser END ===");
    }
  }

  /**
   * Delete a user (soft delete)
   */
  public async deleteUser(hashedUserId: string): Promise<UserServiceResult<void>> {
    try {
      console.log("=== UserService.deleteUser START ===", { hashedUserId });
      
      const response = await this.apiUtil.deleteUser(hashedUserId);
      
      if (response.success) {
        console.log("=== UserService.deleteUser SUCCESS ===");
        this.alertHandler.success("User deleted successfully!", "The user has been removed from the system");
        return {
          success: true
        };
      } else {
        const errorMessage = response.error || "Failed to delete user";
        console.error("UserService.deleteUser failed:", errorMessage);
        this.alertHandler.error(errorMessage, "User Deletion Failed");
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while deleting user";
      console.error("UserService.deleteUser exception:", error);
      this.alertHandler.error(errorMessage, "User Deletion Error");
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      console.log("=== UserService.deleteUser END ===");
    }
  }

  /**
   * Toggle user status between Active and Inactive
   */
  public async toggleUserStatus(hashedUserId: string): Promise<UserServiceResult<{ success: boolean; message: string; newStatus: string }>> {
    try {
      console.log("=== UserService.toggleUserStatus START ===", { hashedUserId });
      
      const response = await this.apiUtil.toggleUserStatus(hashedUserId);
      
      console.log("=== UserService.toggleUserStatus API RESPONSE ===");
      console.log("Response success:", response.success);
      console.log("Response data:", response.data);
      console.log("Response error:", response.error);
      console.log("Response status:", response.status);
      
      if (response.success && response.data) {
        console.log("=== UserService.toggleUserStatus SUCCESS ===");
        const statusText = response.data.newStatus === 'ACTIVE' ? 'activated' : 'deactivated';
        this.alertHandler.success(`User ${statusText} successfully!`, `The user has been ${statusText}`);
        return {
          success: true,
          data: response.data
        };
      } else {
        const errorMessage = response.error || "Failed to toggle user status";
        console.error("UserService.toggleUserStatus failed:", errorMessage);
        console.error("Full response object:", response);
        
        // Try to get more specific error information
        let detailedError = errorMessage;
        if (response.status) {
          detailedError += ` (HTTP ${response.status})`;
        }
        
        this.alertHandler.error(detailedError, "Status Toggle Failed");
        return {
          success: false,
          error: detailedError
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while toggling user status";
      console.error("UserService.toggleUserStatus exception:", error);
      console.error("Error type:", typeof error);
      console.error("Error details:", error);
      
      // Try to extract more details from the error
      let detailedError = errorMessage;
      if (error instanceof Error) {
        detailedError += `: ${error.message}`;
      } else if (typeof error === 'string') {
        detailedError += `: ${error}`;
      }
      
      this.alertHandler.error(detailedError, "Status Toggle Error");
      return {
        success: false,
        error: detailedError
      };
    } finally {
      console.log("=== UserService.toggleUserStatus END ===");
    }
  }

  /**
   * Update user session validity
   */
  public async updateUserSessionValidity(hashedUserId: string, sessionData: SessionValidityRequest): Promise<UserServiceResult<SessionValidityResponse>> {
    try {
      console.log("=== UserService.updateUserSessionValidity START ===", { hashedUserId, sessionData });
      
      const response = await this.apiUtil.updateUserSessionValidity(hashedUserId, sessionData);
      
      if (response.success && response.data) {
        console.log("=== UserService.updateUserSessionValidity SUCCESS ===");
        this.alertHandler.success("Session validity updated!", "User session settings have been updated");
        return {
          success: true,
          data: response.data
        };
      } else {
        const errorMessage = response.error || "Failed to update session validity";
        console.error("UserService.updateUserSessionValidity failed:", errorMessage);
        this.alertHandler.error(errorMessage, "Session Update Failed");
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while updating session validity";
      console.error("UserService.updateUserSessionValidity exception:", error);
      this.alertHandler.error(errorMessage, "Session Update Error");
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      console.log("=== UserService.updateUserSessionValidity END ===");
    }
  }

  /**
   * Reset user password
   */
  public async resetUserPassword(hashedUserId: string): Promise<UserServiceResult<{ success: boolean; message: string }>> {
    try {
      console.log("=== UserService.resetUserPassword START ===", { hashedUserId });
      
      const response = await this.apiUtil.resetUserPassword(hashedUserId);
      
      if (response.success && response.data) {
        console.log("=== UserService.resetUserPassword SUCCESS ===");
        this.alertHandler.success("Password reset successfully!", response.data.message || "User password has been reset");
        return {
          success: true,
          data: response.data
        };
      } else {
        const errorMessage = response.error || "Failed to reset password";
        console.error("UserService.resetUserPassword failed:", errorMessage);
        this.alertHandler.error(errorMessage, "Password Reset Failed");
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while resetting password";
      console.error("UserService.resetUserPassword exception:", error);
      this.alertHandler.error(errorMessage, "Password Reset Error");
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      console.log("=== UserService.resetUserPassword END ===");
    }
  }

  /**
   * Reset user MFA
   */
  public async resetUserMFA(hashedUserId: string): Promise<UserServiceResult<{ success: boolean; message: string }>> {
    try {
      console.log("=== UserService.resetUserMFA START ===", { hashedUserId });
      
      const response = await this.apiUtil.resetUserMFA(hashedUserId);
      
      if (response.success && response.data) {
        console.log("=== UserService.resetUserMFA SUCCESS ===");
        this.alertHandler.success("MFA reset successfully!", response.data.message || "User MFA has been reset");
        return {
          success: true,
          data: response.data
        };
      } else {
        const errorMessage = response.error || "Failed to reset MFA";
        console.error("UserService.resetUserMFA failed:", errorMessage);
        this.alertHandler.error(errorMessage, "MFA Reset Failed");
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while resetting MFA";
      console.error("UserService.resetUserMFA exception:", error);
      this.alertHandler.error(errorMessage, "MFA Reset Error");
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      console.log("=== UserService.resetUserMFA END ===");
    }
  }

  /**
   * Toggle user MFA enable/disable
   */
  public async toggleUserMFA(hashedUserId: string, enabled: boolean): Promise<UserServiceResult<{ success: boolean; message: string; enabled: boolean }>> {
    try {
      console.log("=== UserService.toggleUserMFA START ===", { hashedUserId, enabled });
      
      const response = await this.apiUtil.toggleUserMFA(hashedUserId, enabled);
      
      if (response.success && response.data) {
        console.log("=== UserService.toggleUserMFA SUCCESS ===");
        const action = enabled ? "enabled" : "disabled";
        this.alertHandler.success(`MFA ${action} successfully!`, response.data.message || `User MFA has been ${action}`);
        return {
          success: true,
          data: response.data
        };
      } else {
        const errorMessage = response.error || "Failed to toggle MFA";
        console.error("UserService.toggleUserMFA failed:", errorMessage);
        this.alertHandler.error(errorMessage, "MFA Toggle Failed");
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while toggling MFA";
      console.error("UserService.toggleUserMFA exception:", error);
      this.alertHandler.error(errorMessage, "MFA Toggle Error");
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      console.log("=== UserService.toggleUserMFA END ===");
    }
  }

  /**
   * Get user security status
   */
  public async getUserSecurityStatus(hashedUserId: string): Promise<UserServiceResult<{
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
    try {
      console.log("=== UserService.getUserSecurityStatus START ===", { hashedUserId });
      
      const response = await this.apiUtil.getUserSecurityStatus(hashedUserId);
      
      if (response.success && response.data) {
        console.log("=== UserService.getUserSecurityStatus SUCCESS ===");
        return {
          success: true,
          data: response.data
        };
      } else {
        const errorMessage = response.error || "Failed to get security status";
        console.error("UserService.getUserSecurityStatus failed:", errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while getting security status";
      console.error("UserService.getUserSecurityStatus exception:", error);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      console.log("=== UserService.getUserSecurityStatus END ===");
    }
  }

  /**
   * Search users with pagination - follows backend standard from API_PAGINATION_EXAMPLES.md
   */
  public async searchUsers(searchQuery: string, page: number = 1, size: number = 20, sortBy: string = 'userCode', sortDir: 'asc' | 'desc' = 'asc'): Promise<UserServiceResult<{users: User[], total: number, page: number, totalPages: number, pageSize: number}>> {
    try {
      console.log("=== UserService.searchUsers START ===", { searchQuery, page, size, sortBy, sortDir });
      
      const response = await this.apiUtil.searchUsers(searchQuery, page, size, sortBy, sortDir);
      
      if (response.success && response.data) {
        console.log("=== UserService.searchUsers SUCCESS ===");
        return {
          success: true,
          data: response.data
        };
      } else {
        const errorMessage = response.error || "Failed to search users";
        console.error("UserService.searchUsers failed:", errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while searching users";
      console.error("UserService.searchUsers exception:", error);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      console.log("=== UserService.searchUsers END ===");
    }
  }

  /**
   * Flexible search users with advanced criteria - follows FLEXIBLE_SEARCH_ARCHITECTURE.md
   * Updated to align with backend named parameter implementation from NAMED_PARAMETER_FIX_SUMMARY.md
   */
  public async searchUsersFlexible(criteria: UserSearchCriteria): Promise<SearchServiceResult<User>> {
    try {
      console.log("=== UserService.searchUsersFlexible START ===", criteria);
      
      // Validate search criteria
      const validation = SearchUtils.validateCriteria(criteria, USER_SEARCH_CONFIG);
      if (!validation.valid) {
        console.error("Invalid search criteria:", validation.errors);
        return {
          success: false,
          error: `Invalid search criteria: ${validation.errors.join(', ')}`
        };
      }
      
      // Set defaults from config
      const searchCriteria: UserSearchCriteria = {
        page: criteria.page || 1,
        size: criteria.size || USER_SEARCH_CONFIG.defaultPageSize,
        sortBy: criteria.sortBy || USER_SEARCH_CONFIG.defaultSortBy,
        sortDir: criteria.sortDir || USER_SEARCH_CONFIG.defaultSortDir,
        exactMatch: criteria.exactMatch || false,
        caseSensitive: criteria.caseSensitive || false,
        ...criteria
      };
      
      // Transform criteria to align with backend named parameters
      const backendCriteria: Record<string, any> = { ...searchCriteria };
      
      // Handle global search mapping for multiple field searches
      if (searchCriteria.q && !searchCriteria.globalSearch) {
        backendCriteria.globalSearch = searchCriteria.q;
      }
      
      // Ensure proper parameter naming for backend
      console.log("Transformed criteria for backend named parameters:", backendCriteria);
      
      // Build query string for API call
      const queryString = SearchUtils.buildAPIQueryString(backendCriteria);
      console.log("API Query String:", queryString);
      console.log("API Query String parsed back:", new URLSearchParams(queryString).toString());
      console.log("Individual query parameters:");
      new URLSearchParams(queryString).forEach((value, key) => {
        console.log(`  ${key} = ${value}`);
      });
      
      // Make API call
      const response = await this.apiUtil.searchUsersFlexible(queryString);
      
      if (response.success && response.data) {
        console.log("=== UserService.searchUsersFlexible SUCCESS ===");
        
        // Transform response to match SearchResponse interface
        const searchResponse: SearchResponse<User> = {
          content: response.data.users || response.data.content || [],
          page: response.data.page || searchCriteria.page!,
          size: response.data.pageSize || response.data.size || searchCriteria.size!,
          totalElements: response.data.total || response.data.totalElements || 0,
          totalPages: response.data.totalPages || Math.ceil((response.data.total || 0) / (searchCriteria.size || 20)),
          first: (response.data.page || searchCriteria.page!) === 1,
          last: (response.data.page || searchCriteria.page!) >= (response.data.totalPages || 1),
          searchCriteria: backendCriteria
        };
        
        return {
          success: true,
          data: searchResponse
        };
      } else {
        const errorMessage = response.error || "Failed to search users with flexible criteria";
        console.error("UserService.searchUsersFlexible failed:", errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while searching users with flexible criteria";
      console.error("UserService.searchUsersFlexible exception:", error);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      console.log("=== UserService.searchUsersFlexible END ===");
    }
  }

  /**
   * Get user approval requests
   */
  public async getUserApprovalRequests(hashedUserId: string): Promise<UserServiceResult<any[]>> {
    try {
      console.log("=== UserService.getUserApprovalRequests START ===", { hashedUserId });
      
      const response = await this.apiUtil.getUserApprovalRequests(hashedUserId);
      
      if (response.success && response.data) {
        console.log("=== UserService.getUserApprovalRequests SUCCESS ===");
        return {
          success: true,
          data: response.data
        };
      } else {
        const errorMessage = response.error || "Failed to fetch user approval requests";
        console.error("UserService.getUserApprovalRequests failed:", errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while fetching user approval requests";
      console.error("UserService.getUserApprovalRequests exception:", error);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      console.log("=== UserService.getUserApprovalRequests END ===");
    }
  }

  /**
   * Search/filter users based on criteria
   */
  public async searchUsersLegacy(searchCriteria: Record<string, string>, allUsers: User[]): Promise<UserServiceResult<User[]>> {
    try {
      console.log("=== UserService.searchUsersLegacy START ===", { searchCriteria });
      
      // For now, we'll do client-side filtering since we already have all the data
      // In the future, this could be moved to server-side with API parameters
      const filteredUsers = allUsers.filter(user => {
        return Object.entries(searchCriteria).every(([key, searchValue]) => {
          if (!searchValue) return true;
          
          const cellValue = user[key as keyof User];
          
          // Handle status field specially (convert string to number)
          if (key === 'isActive') {
            return parseInt(searchValue) === cellValue;
          }
          
          // Partial match for text search
          return cellValue?.toString().toLowerCase().includes(searchValue.toLowerCase());
        });
      });
      
      console.log("=== UserService.searchUsersLegacy SUCCESS ===", { 
        totalUsers: allUsers.length, 
        filteredUsers: filteredUsers.length 
      });
      
      return {
        success: true,
        data: filteredUsers
      };
    } catch (error) {
      const errorMessage = "An unexpected error occurred while searching users";
      console.error("UserService.searchUsersLegacy exception:", error);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      console.log("=== UserService.searchUsersLegacy END ===");
    }
  }

  /**
   * Get all users using explicit list endpoint (legacy method for backward compatibility)
   */
  public async getAllUsersList(): Promise<UserServiceResult<User[]>> {
    try {
      console.log("=== UserService.getAllUsersList START ===");
      
      const response = await this.apiUtil.getAllUsersList();
      
      if (response.success && response.data) {
        console.log("=== UserService.getAllUsersList SUCCESS ===");
        return {
          success: true,
          data: response.data
        };
      } else {
        const errorMessage = response.error || "Failed to fetch all users list";
        console.error("UserService.getAllUsersList failed:", errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred while fetching all users list";
      console.error("UserService.getAllUsersList exception:", error);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      console.log("=== UserService.getAllUsersList END ===");
    }
  }
} 