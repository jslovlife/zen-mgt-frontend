/**
 * Enum API Types
 * Based on backend enum API specification
 */

// Core enum structure from backend
export interface EnumDTO {
  code: number;
  name: string;
  display: string;
  description?: string;
  category: string;
  sortOrder: number;
  isDefault: boolean;
  metadata?: Record<string, any>;
}

// API response structure - updated to match actual backend format
export interface EnumApiResponse<T> {
  success: boolean;
  error: boolean;
  code: string;
  msg: string;
  data: T;
  timestamp?: string;
}

// All enums collection from /all endpoint
export interface EnumCollections {
  recordStatuses: EnumDTO[];
  approvalRequestTypes: EnumDTO[];
  approvalStatuses: EnumDTO[];
  sysApprovalRequestStatuses: EnumDTO[];
  referenceTypes: EnumDTO[];
}

// Context options for enum filtering
export type EnumContext = 
  | 'user_management'
  | 'approval_management'
  | 'system_administration';

// Enum API client interface
export interface EnumApiClient {
  getRecordStatuses(token: string, context?: EnumContext): Promise<EnumDTO[]>;
  getApprovalRequestTypes(token: string): Promise<EnumDTO[]>;
  getApprovalStatuses(token: string): Promise<EnumDTO[]>;
  getSysApprovalRequestStatuses(token: string): Promise<EnumDTO[]>;
  getReferenceTypes(token: string): Promise<EnumDTO[]>;
  getAllEnums(token: string): Promise<EnumCollections>;
  healthCheck(): Promise<boolean>;
}

// Helper types for UI components
export interface EnumSelectOption {
  value: number;
  label: string;
}

export interface EnumMetadata {
  color?: string;
  icon?: string;
  [key: string]: any;
} 