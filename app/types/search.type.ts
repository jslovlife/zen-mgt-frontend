// Reusable Search Architecture Types
// Based on FLEXIBLE_SEARCH_ARCHITECTURE.md specification
// Updated to align with NAMED_PARAMETER_FIX_SUMMARY.md backend implementation

/**
 * Base search criteria interface for all modules
 */
export interface BaseSearchCriteria {
  // Global search
  q?: string;
  
  // Search options
  exactMatch?: boolean;
  caseSensitive?: boolean;
  
  // Pagination
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

/**
 * Date range filter interface
 */
export interface DateRangeFilter {
  from?: string; // ISO datetime string
  to?: string;   // ISO datetime string
}

/**
 * User-specific search criteria extending base criteria
 * Aligns with backend UserSearchCriteria.java and named parameter implementation
 * Parameter names match the named parameters used in UserQueryBuilder.java
 */
export interface UserSearchCriteria extends BaseSearchCriteria {
  // Text-based searches - mapped to named parameters
  username?: string;          // Maps to :username parameter
  email?: string;            // Maps to :email parameter
  userCode?: string;         // Maps to :userCode parameter
  
  // Status filters - mapped to named parameters
  recordStatus?: string[];         // Maps to :status parameter (RecordStatus enum values)
  
  // Date range filters - mapped to named parameters
  createdDateFrom?: string;  // Maps to :createdDateFrom parameter (renamed for backend alignment)
  createdDateTo?: string;    // Maps to :createdDateTo parameter (renamed for backend alignment)
  updatedDateFrom?: string;  // Maps to :updatedDateFrom parameter
  updatedDateTo?: string;    // Maps to :updatedDateTo parameter
  lastLoginFrom?: string;    // Maps to :lastLoginFrom parameter
  lastLoginTo?: string;      // Maps to :lastLoginTo parameter
  
  // Global search parameters - for multiple field search
  globalSearch?: string;     // Maps to :globalSearch1, :globalSearch2, etc.
}

/**
 * Search field configuration for dynamic SearchFilter component
 */
export interface SearchFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'boolean';
  placeholder?: string;
  options?: Array<{ label: string; value: string | number | boolean }>;
  searchable?: boolean;
  filterable?: boolean;
  width?: string; // CSS width value
}

/**
 * Search response interface matching backend structure
 */
export interface SearchResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  searchCriteria?: Record<string, any>;
}

/**
 * Search service result interface
 */
export interface SearchServiceResult<T = any> {
  success: boolean;
  data?: SearchResponse<T>;
  error?: string;
}

/**
 * Module-specific search configurations
 */
export interface ModuleSearchConfig {
  module: string;
  endpoint: string;
  searchFields: SearchFieldConfig[];
  defaultSortBy: string;
  defaultSortDir: 'asc' | 'desc';
  defaultPageSize: number;
}

/**
 * User module search configuration
 * Updated to align with backend named parameter implementation
 */
export const USER_SEARCH_CONFIG: ModuleSearchConfig = {
  module: 'user',
  endpoint: '/mgt/v1/users/search',
  defaultSortBy: 'userCode',
  defaultSortDir: 'asc',
  defaultPageSize: 20,
  searchFields: [
    {
      key: 'username',
      label: 'Username',
      type: 'text',
      placeholder: 'Search by username...',
      searchable: true,
      filterable: true,
      width: '200px'
    },
    {
      key: 'userCode',
      label: 'User Code',
      type: 'text',
      placeholder: 'Search by user code...',
      searchable: true,
      filterable: true,
      width: '180px'
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      placeholder: 'Search by email...',
      searchable: true,
      filterable: true,
      width: '220px'
    },
    {
      key: 'recordStatus',
      label: 'Status',
      type: 'select',
      searchable: true,
      filterable: true,
      width: '150px',
      options: [
        { label: 'All Status', value: '' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
        { label: 'Pending Amendment', value: 'PENDING_AMENDMENT_APPROVAL' },
        { label: 'Pending De', value: 'PENDING_ACTIVATE_APPROVAL' },

      ]
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'select',
      searchable: true,
      filterable: true,
      width: '120px',
      options: [
        { label: 'All', value: '' },
        { label: 'Active', value: true },
        { label: 'Inactive', value: false }
      ]
    },
    {
      key: 'createdDate',
      label: 'Created Date',
      type: 'dateRange',
      searchable: false,
      filterable: true,
      width: '200px'
    }
  ]
};

/**
 * Utility functions for search operations
 * Updated to align with backend named parameter implementation
 */
export class SearchUtils {
  /**
   * Convert search criteria to URL search parameters
   */
  static criteriaToURLParams(criteria: Record<string, any>): URLSearchParams {
    const params = new URLSearchParams();
    
    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          // For array values (like status), join with comma
          params.set(key, value.join(','));
        } else {
          params.set(key, value.toString());
        }
      }
    });
    
    return params;
  }
  
  /**
   * Extract search criteria from URL search parameters
   * Updated to handle named parameter mapping for date ranges
   */
  static URLParamsToCriteria(params: URLSearchParams, config: ModuleSearchConfig): Record<string, any> {
    const criteria: Record<string, any> = {};
    
    // Extract standard parameters
    const page = params.get('page');
    const size = params.get('size');
    const sortBy = params.get('sortBy');
    const sortDir = params.get('sortDir');
    const q = params.get('q');
    const exactMatch = params.get('exactMatch');
    const caseSensitive = params.get('caseSensitive');
    
    if (page) criteria.page = parseInt(page);
    if (size) criteria.size = parseInt(size);
    if (sortBy) criteria.sortBy = sortBy;
    if (sortDir) criteria.sortDir = sortDir;
    if (q) criteria.q = q;
    if (exactMatch) criteria.exactMatch = exactMatch === 'true';
    if (caseSensitive) criteria.caseSensitive = caseSensitive === 'true';
    
    // Extract field-specific parameters
    config.searchFields.forEach(field => {
      const value = params.get(field.key);
      if (value) {
        if (field.type === 'select' && field.key === 'status') {
          // Handle comma-separated status values
          criteria[field.key] = value.split(',');
        } else if (field.type === 'boolean') {
          criteria[field.key] = value === 'true';
        } else {
          criteria[field.key] = value;
        }
      }
      
      // Handle date range fields - map to backend named parameters
      if (field.type === 'dateRange') {
        const fromValue = params.get(`${field.key}From`);
        const toValue = params.get(`${field.key}To`);
        
        // Map UI field names to backend named parameter names
        if (field.key === 'createdDate') {
          if (fromValue) criteria.createdDateFrom = fromValue;
          if (toValue) criteria.createdDateTo = toValue;
        } else if (field.key === 'updatedDate') {
          if (fromValue) criteria.updatedDateFrom = fromValue;
          if (toValue) criteria.updatedDateTo = toValue;
        } else if (field.key === 'lastLogin') {
          if (fromValue) criteria.lastLoginFrom = fromValue;
          if (toValue) criteria.lastLoginTo = toValue;
        }
      }
    });
    
    return criteria;
  }
  
  /**
   * Build API query string from search criteria
   * Ensures proper mapping to backend named parameters
   */
  static buildAPIQueryString(criteria: Record<string, any>): string {
    const params = new URLSearchParams();
    
    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          // For array values (like status), join with comma
          params.set(key, value.join(','));
        } else if (typeof value === 'object' && value !== null) {
          // Handle date range objects - don't serialize objects directly
          // Date ranges should be handled separately in URLParamsToCriteria
        } else {
          params.set(key, value.toString());
        }
      }
    });
    
    return params.toString();
  }
  
  /**
   * Validate search criteria
   */
  static validateCriteria(criteria: Record<string, any>, config: ModuleSearchConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate page and size
    if (criteria.page && (criteria.page < 1 || criteria.page > 1000)) {
      errors.push('Page must be between 1 and 1000');
    }
    
    if (criteria.size && (criteria.size < 1 || criteria.size > 100)) {
      errors.push('Page size must be between 1 and 100');
    }
    
    // Validate sort fields
    if (criteria.sortBy) {
      const validSortFields = config.searchFields.map(f => f.key);
      validSortFields.push('createdAt', 'updatedAt', 'lastLoginAt'); // Add standard sort fields
      if (!validSortFields.includes(criteria.sortBy)) {
        errors.push(`Invalid sort field: ${criteria.sortBy}`);
      }
    }
    
    if (criteria.sortDir && !['asc', 'desc'].includes(criteria.sortDir)) {
      errors.push('Sort direction must be "asc" or "desc"');
    }
    
    // Validate date formats for named parameters
    const dateFields = ['createdDateFrom', 'createdDateTo', 'updatedDateFrom', 'updatedDateTo', 'lastLoginFrom', 'lastLoginTo'];
    dateFields.forEach(field => {
      if (criteria[field]) {
        const dateValue = criteria[field];
        if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(dateValue)) {
          errors.push(`Invalid date format for ${field}: expected YYYY-MM-DD or ISO datetime`);
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
} 