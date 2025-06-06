/**
 * Enum Hooks
 * Custom hooks for working with enum data from the API
 */

import { useMemo } from 'react';
import type { EnumDTO, EnumSelectOption } from '~/types/enum.type';

/**
 * Hook to provide helper functions for working with enum arrays
 */
export function useEnumHelpers(enums: EnumDTO[]) {
  return useMemo(() => ({
    // Get enum by code
    getByCode: (code: number): EnumDTO | undefined => 
      enums.find(e => e.code === code),

    // Get enum by name
    getByName: (name: string): EnumDTO | undefined => 
      enums.find(e => e.name === name),

    // Get display text by code
    getDisplayByCode: (code: number): string => 
      enums.find(e => e.code === code)?.display || 'Unknown',

    // Get default enum
    getDefault: (): EnumDTO | undefined => 
      enums.find(e => e.isDefault),

    // Get sorted enums
    getSorted: (): EnumDTO[] => 
      [...enums].sort((a, b) => a.sortOrder - b.sortOrder),

    // Get options for select components (with string values for SearchableDropdown)
    getSelectOptions: (): Array<{ label: string; value: string }> => 
      enums
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(e => ({ value: e.code.toString(), label: e.display })),

    // Get options for select components (with number values)
    getNumberSelectOptions: (): EnumSelectOption[] => 
      enums
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(e => ({ value: e.code, label: e.display })),

    // Filter by metadata
    filterByMetadata: (key: string, value: any): EnumDTO[] =>
      enums.filter(e => e.metadata?.[key] === value),

    // Get enum metadata
    getMetadata: (code: number, key: string): any => 
      enums.find(e => e.code === code)?.metadata?.[key],

    // Check if enum exists
    exists: (code: number): boolean => 
      enums.some(e => e.code === code),

    // Get enum count
    getCount: (): number => enums.length,
  }), [enums]);
}

/**
 * Hook to get record status specific helpers
 */
export function useRecordStatusHelpers(recordStatuses: EnumDTO[]) {
  const helpers = useEnumHelpers(recordStatuses);
  
  return useMemo(() => ({
    ...helpers,
    
    // Get status color for UI
    getStatusColor: (code: number): string => {
      const status = helpers.getByCode(code);
      return status?.metadata?.color || 'gray';
    },

    // Get status icon
    getStatusIcon: (code: number): string | undefined => {
      const status = helpers.getByCode(code);
      return status?.metadata?.icon;
    },

    // Check if status is active
    isActive: (code: number): boolean => {
      const status = helpers.getByCode(code);
      return status?.name === 'ACTIVE';
    },

    // Check if status is inactive
    isInactive: (code: number): boolean => {
      const status = helpers.getByCode(code);
      return status?.name === 'INACTIVE';
    },

    // Get CSS classes for status badge
    getStatusBadgeClasses: (code: number): string => {
      const status = helpers.getByCode(code);
      const color = status?.metadata?.color || 'gray';
      
      const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
      
      switch (color) {
        case 'green':
          return `${baseClasses} bg-green-100 text-green-800`;
        case 'red':
          return `${baseClasses} bg-red-100 text-red-800`;
        case 'yellow':
          return `${baseClasses} bg-yellow-100 text-yellow-800`;
        case 'blue':
          return `${baseClasses} bg-blue-100 text-blue-800`;
        default:
          return `${baseClasses} bg-gray-100 text-gray-800`;
      }
    },
  }), [recordStatuses, helpers]);
} 