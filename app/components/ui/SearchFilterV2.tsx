import React, { useState, useEffect } from 'react';
import { SearchableDropdown } from './SearchableDropdown';

/**
 * SearchFilterV2 - Flexible and Reusable Search Component
 * 
 * A highly configurable search filter component that automatically handles:
 * - Different field types (text, dropdown, timestamp)
 * - Automatic timestamp range fields (From/To)
 * - State management and form handling
 * - Active filter display with individual removal
 * - Responsive grid layout
 * 
 * @example
 * // Basic Usage
 * const searchFields: SearchFieldConfig[] = [
 *   { key: 'name', label: 'Name', type: 'text' },
 *   { key: 'status', label: 'Status', type: 'dropdown', options: [...] },
 *   { key: 'createdAt', label: 'Created', type: 'timestamp', gridCols: 2 }
 * ];
 * 
 * <SearchFilterV2
 *   fields={searchFields}
 *   onSearch={(values) => console.log(values)}
 *   initialValues={initialValues}
 *   loading={loading}
 * />
 * 
 * @example
 * // Advanced Configuration
 * const fields: SearchFieldConfig[] = [
 *   {
 *     key: 'username',
 *     label: 'Username', 
 *     type: 'text',
 *     placeholder: 'Enter username...',
 *     gridCols: 1
 *   },
 *   {
 *     key: 'role',
 *     label: 'Role',
 *     type: 'dropdown',
 *     options: [
 *       { label: 'Admin', value: 'admin' },
 *       { label: 'User', value: 'user' }
 *     ]
 *   },
 *   {
 *     key: 'lastLogin',
 *     label: 'Last Login',
 *     type: 'timestamp',
 *     gridCols: 2  // Spans 2 columns (1 for From, 1 for To)
 *   }
 * ];
 */

// Field types supported by SearchFilterV2
export type SearchFieldType = 'text' | 'dropdown' | 'timestamp';

// Configuration for each search field
export interface SearchFieldConfig {
  key: string;
  label: string;
  type: SearchFieldType;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>; // For dropdown type
  gridCols?: number; // How many grid columns this field should span (1-4)
}

// Props for SearchFilterV2 component
export interface SearchFilterV2Props {
  fields: SearchFieldConfig[];
  onSearch: (searchValues: Record<string, any>) => void;
  onClear?: () => void;
  initialValues?: Record<string, string>;
  loading?: boolean;
  className?: string;
  title?: string;
}

export const SearchFilterV2: React.FC<SearchFilterV2Props> = ({
  fields,
  onSearch,
  onClear,
  initialValues = {},
  loading = false,
  className = '',
  title
}) => {
  // Initialize form values state
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.type === 'timestamp') {
        // For timestamp fields, create From and To variants
        initial[`${field.key}From`] = initialValues[`${field.key}From`] || '';
        initial[`${field.key}To`] = initialValues[`${field.key}To`] || '';
      } else {
        initial[field.key] = initialValues[field.key] || '';
      }
    });
    
    return initial;
  });

  // Update form values when initialValues change
  useEffect(() => {
    const updated: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.type === 'timestamp') {
        updated[`${field.key}From`] = initialValues[`${field.key}From`] || '';
        updated[`${field.key}To`] = initialValues[`${field.key}To`] || '';
      } else {
        updated[field.key] = initialValues[field.key] || '';
      }
    });
    
    setFormValues(updated);
  }, [initialValues, fields]);

  // Handle input changes
  const handleInputChange = (fieldKey: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty values
    const searchValues: Record<string, any> = {};
    Object.entries(formValues).forEach(([key, value]) => {
      if (value && value.toString().trim()) {
        searchValues[key] = value.toString().trim();
      }
    });
    
    onSearch(searchValues);
  };

  // Handle clear all
  const handleClearAll = () => {
    const clearedValues: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.type === 'timestamp') {
        clearedValues[`${field.key}From`] = '';
        clearedValues[`${field.key}To`] = '';
      } else {
        clearedValues[field.key] = '';
      }
    });
    
    setFormValues(clearedValues);
    onSearch({});
    
    if (onClear) {
      onClear();
    }
  };

  // Render individual field based on type
  const renderField = (field: SearchFieldConfig) => {
    const baseInputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm";
    
    switch (field.type) {
      case 'text':
        return (
          <div key={field.key} className={`col-span-${field.gridCols || 1}`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type="text"
              name={field.key}
              value={formValues[field.key] || ''}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={field.placeholder || `Search by ${field.label.toLowerCase()}...`}
              className={baseInputClasses}
            />
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.key} className={`col-span-${field.gridCols || 1}`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <SearchableDropdown
              options={[
                { label: `All ${field.label}`, value: '' },
                ...(field.options || [])
              ]}
              value={formValues[field.key] || ''}
              onChange={(value) => handleInputChange(field.key, value)}
              placeholder={field.placeholder || `All ${field.label}`}
              className="w-full"
            />
          </div>
        );

      case 'timestamp':
        return (
          <React.Fragment key={field.key}>
            {/* From DateTime */}
            <div className={`col-span-${Math.ceil((field.gridCols || 2) / 2)}`}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} From
              </label>
              <input
                type="datetime-local"
                name={`${field.key}From`}
                value={formValues[`${field.key}From`] || ''}
                onChange={(e) => handleInputChange(`${field.key}From`, e.target.value)}
                step="1"
                className={baseInputClasses}
              />
            </div>
            
            {/* To DateTime */}
            <div className={`col-span-${Math.ceil((field.gridCols || 2) / 2)}`}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} To
              </label>
              <input
                type="datetime-local"
                name={`${field.key}To`}
                value={formValues[`${field.key}To`] || ''}
                onChange={(e) => handleInputChange(`${field.key}To`, e.target.value)}
                step="1"
                className={baseInputClasses}
              />
            </div>
          </React.Fragment>
        );

      default:
        return null;
    }
  };

  // Check if there are any active filters
  const hasActiveFilters = Object.keys(formValues).some(key => 
    formValues[key] !== null && 
    formValues[key] !== undefined && 
    formValues[key] !== ''
  );

  // Generate filter label for active filters display
  const getFilterLabel = (key: string, value: any) => {
    // Find the field configuration
    const field = fields.find(f => 
      f.key === key || 
      key === `${f.key}From` || 
      key === `${f.key}To`
    );
    
    if (!field) return `${key}: ${value}`;
    
    // Handle timestamp fields
    if (key.endsWith('From')) {
      return `${field.label} From: ${new Date(value).toLocaleString()}`;
    }
    if (key.endsWith('To')) {
      return `${field.label} To: ${new Date(value).toLocaleString()}`;
    }
    
    // Handle dropdown fields - find the label for the value
    if (field.type === 'dropdown' && field.options) {
      const option = field.options.find(opt => opt.value === value);
      const displayValue = option?.label || value;
      return `${field.label}: ${displayValue}`;
    }
    
    // Handle text fields
    return `${field.label}: ${value}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Search Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {fields.map(renderField)}
        </div>

        {/* Active Search Criteria Bubbles */}
        {hasActiveFilters && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(formValues).map(([key, value]) => {
                if (!value || value === '') return null;

                return (
                  <div
                    key={key}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full border border-purple-200"
                  >
                    <span>{getFilterLabel(key, value)}</span>
                    <button
                      type="button"
                      onClick={() => handleInputChange(key, '')}
                      className="ml-1 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                      title="Remove filter"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
              
              {/* Clear All Filters Button */}
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-300 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Search Button and Reset */}
        <div className="flex items-center justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-purple-600 border border-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>{loading ? 'Searching...' : 'Search'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}; 