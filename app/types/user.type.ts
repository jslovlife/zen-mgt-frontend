export interface User {
  id: number;
  hashedUserId: string;  // Updated from hashedUserId to match backend
  userCode: string;
  username: string;
  email: string;
  recordStatus?: string;     // Added field from backend
  sessionValidity: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  recordStatus?: boolean;        // Added field
  sessionValidity?: number;
  // Removed hashedCreatedBy - backend uses X-Current-User header instead
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  sessionValidity?: number;
  // Removed recordStatus and hashedUpdatedBy - recordStatus is no longer editable
}

export interface SessionValidityRequest {
  sessionValidityMs: number;
}

export interface SessionValidityResponse {
  message: string;
  sessionValidityMs: number;
  sessionValidityHours: number;
}