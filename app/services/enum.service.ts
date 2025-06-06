/**
 * Enum API Service
 * Handles all interactions with the backend enum API
 */

import { API_CONFIG } from "~/config/api";
import type { 
  EnumDTO, 
  EnumApiResponse, 
  EnumCollections, 
  EnumContext,
  EnumApiClient 
} from "~/types/enum.type";

export class EnumService implements EnumApiClient {
  private static instance: EnumService;
  private baseUrl: string;
  private enumBasePath: string;

  private constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.enumBasePath = `${API_CONFIG.API_PREFIX}/enums`;
  }

  public static getInstance(): EnumService {
    if (!EnumService.instance) {
      EnumService.instance = new EnumService();
    }
    return EnumService.instance;
  }

  private async makeRequest<T>(
    endpoint: string,
    token: string,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${this.enumBasePath}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    console.log("=== ENUM API REQUEST ===");
    console.log("URL:", url.toString());
    console.log("Token:", token?.substring(0, 20) + "...");

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: EnumApiResponse<T> = await response.json();
    console.log("API Response:", result);
    
    if (!result.success || result.code !== '0000') {
      throw new Error(result.msg || 'API request failed');
    }

    return result.data;
  }

  async getRecordStatuses(token: string, context?: EnumContext): Promise<EnumDTO[]> {
    const params = context ? { context } : undefined;
    return this.makeRequest<EnumDTO[]>('/record-statuses', token, params);
  }

  async getApprovalRequestTypes(token: string): Promise<EnumDTO[]> {
    return this.makeRequest<EnumDTO[]>('/approval-request-types', token);
  }

  async getApprovalStatuses(token: string): Promise<EnumDTO[]> {
    return this.makeRequest<EnumDTO[]>('/approval-statuses', token);
  }

  async getSysApprovalRequestStatuses(token: string): Promise<EnumDTO[]> {
    return this.makeRequest<EnumDTO[]>('/sys-approval-request-statuses', token);
  }

  async getReferenceTypes(token: string): Promise<EnumDTO[]> {
    return this.makeRequest<EnumDTO[]>('/reference-types', token);
  }

  async getAllEnums(token: string): Promise<EnumCollections> {
    console.log("=== FETCHING ALL ENUMS ===");
    return this.makeRequest<EnumCollections>('/all', token);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}${this.enumBasePath}/health`;
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }
} 