/**
 * Enum Cache Utility
 * Manages localStorage caching of enum data
 */

import type { EnumCollections } from "~/types/enum.type";

interface EnumCacheData {
  data: EnumCollections;
  timestamp: number;
  version: string;
  token?: string; // For debugging
}

const ENUM_CACHE_KEY = 'zen_mgt_enums';
const CACHE_EXPIRY_HOURS = 24; // 24 hours cache
const CACHE_VERSION = '1.0';

export class EnumCacheUtil {
  /**
   * Get cached enums from localStorage
   */
  static getCachedEnums(): EnumCollections | null {
    try {
      if (typeof window === 'undefined') return null;
      
      const cached = localStorage.getItem(ENUM_CACHE_KEY);
      if (!cached) {
        console.log("No enum cache found in localStorage");
        return null;
      }

      const cacheData: EnumCacheData = JSON.parse(cached);
      
      // Check version
      if (cacheData.version !== CACHE_VERSION) {
        console.log("Enum cache version mismatch, clearing cache");
        this.clearCache();
        return null;
      }

      // Check expiry
      const now = Date.now();
      const ageHours = (now - cacheData.timestamp) / (1000 * 60 * 60);
      
      if (ageHours > CACHE_EXPIRY_HOURS) {
        console.log(`Enum cache expired (${ageHours.toFixed(1)} hours old), clearing cache`);
        this.clearCache();
        return null;
      }

      console.log(`Using cached enums (${ageHours.toFixed(1)} hours old):`, {
        recordStatuses: cacheData.data.recordStatuses?.length || 0,
        approvalRequestTypes: cacheData.data.approvalRequestTypes?.length || 0,
        approvalStatuses: cacheData.data.approvalStatuses?.length || 0,
        sysApprovalRequestStatuses: cacheData.data.sysApprovalRequestStatuses?.length || 0,
        referenceTypes: cacheData.data.referenceTypes?.length || 0,
      });

      return cacheData.data;
    } catch (error) {
      console.error("Error reading enum cache:", error);
      this.clearCache();
      return null;
    }
  }

  /**
   * Cache enums in localStorage
   */
  static cacheEnums(enums: EnumCollections, token?: string): void {
    try {
      if (typeof window === 'undefined') return;

      const cacheData: EnumCacheData = {
        data: enums,
        timestamp: Date.now(),
        version: CACHE_VERSION,
        token: token?.substring(0, 20) + "..." // For debugging
      };

      localStorage.setItem(ENUM_CACHE_KEY, JSON.stringify(cacheData));
      console.log("Enums cached successfully in localStorage");
    } catch (error) {
      console.error("Error caching enums:", error);
    }
  }

  /**
   * Clear enum cache
   */
  static clearCache(): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(ENUM_CACHE_KEY);
      console.log("Enum cache cleared");
    } catch (error) {
      console.error("Error clearing enum cache:", error);
    }
  }

  /**
   * Check if cache exists and is valid
   */
  static isCacheValid(): boolean {
    return this.getCachedEnums() !== null;
  }

  /**
   * Get cache info for debugging
   */
  static getCacheInfo(): { exists: boolean; age?: number; version?: string } {
    try {
      if (typeof window === 'undefined') return { exists: false };
      
      const cached = localStorage.getItem(ENUM_CACHE_KEY);
      if (!cached) return { exists: false };

      const cacheData: EnumCacheData = JSON.parse(cached);
      const ageHours = (Date.now() - cacheData.timestamp) / (1000 * 60 * 60);

      return {
        exists: true,
        age: ageHours,
        version: cacheData.version
      };
    } catch {
      return { exists: false };
    }
  }
} 