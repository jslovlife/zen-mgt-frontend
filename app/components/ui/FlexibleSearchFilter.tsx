import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar } from 'lucide-react';
import { SearchFieldConfig, ModuleSearchConfig, SearchUtils } from '~/types/search.type';
import { SearchableDropdown } from './SearchableDropdown';

interface FlexibleSearchFilterProps {
  config: ModuleSearchConfig;
  initialValues?: Record<string, any>;
  onSearch: (searchValues: Record<string, any>) => void;
  loading?: boolean;
  className?: string;
}

/**
 * Reusable FlexibleSearchFilter component based on FLEXIBLE_SEARCH_ARCHITECTURE.md
 * Supports multiple search field types and can be configured for different modules
 */
export function FlexibleSearchFilter({
  config,
  initialValues = {},
  onSearch,
  loading = false,
  className = ''
}: FlexibleSearchFilterProps) {
  const [searchValues, setSearchValues] = useState<Record<string, any>>(initialValues);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get searchable fields from config
  const searchableFields = config.searchFields.filter(field => field.searchable);
  
  // Primary search field (first searchable field)
  const primaryField = searchableFields[0];
  
  // Advanced search fields (remaining searchable fields)
  const advancedFields = searchableFields.slice(1);

  // Initialize search values
  useEffect(() => {
    setSearchValues(initialValues);
  }, [initialValues]);

  // Handle input changes
  const handleInputChange = (fieldKey: string, value: any) => {
    setSearchValues(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  // Handle search execution
  const handleSearch = () => {
    // Clean up empty values
    const cleanedValues = Object.entries(searchValues).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    onSearch(cleanedValues);
  };

  // Handle clear all
  const handleClearAll = () => {
    setSearchValues({});
    onSearch({});
  };

  // Handle Enter key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Render search field based on type
  const renderSearchField = (field: SearchFieldConfig, value: any) => {
    const fieldWidth = field.width || '200px';
    
    switch (field.type) {
      case 'text':
        return (
          <div 
            key={field.key}
            className="flex-shrink-0"
            style={{ width: fieldWidth }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder={field.placeholder || `Search ${field.label.toLowerCase()}...`}
                value={value || ''}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                style={{
                  backgroundColor: 'var(--color-background-primary)',
                  borderColor: 'var(--color-border-primary)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          </div>
        );

      case 'select':
        return (
          <div 
            key={field.key}
            className="flex-shrink-0"
            style={{ width: fieldWidth }}
          >
            <SearchableDropdown
              options={(field.options || []).map(opt => ({
                label: opt.label,
                value: opt.value?.toString() || ''
              }))}
              value={value?.toString() || ''}
              onChange={(selectedValue) => handleInputChange(field.key, selectedValue)}
              placeholder={field.placeholder || `Select ${field.label.toLowerCase()}...`}
              className="w-full"
            />
          </div>
        );

      case 'date':
        return (
          <div 
            key={field.key}
            className="flex-shrink-0"
            style={{ width: fieldWidth }}
          >
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="date"
                value={value || ''}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                style={{
                  backgroundColor: 'var(--color-background-primary)',
                  borderColor: 'var(--color-border-primary)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          </div>
        );

      case 'dateRange':
        return (
          <div 
            key={field.key}
            className="flex-shrink-0"
            style={{ width: fieldWidth }}
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
                <input
                  type="date"
                  placeholder="From"
                  value={value?.from || ''}
                  onChange={(e) => handleInputChange(field.key, { ...value, from: e.target.value })}
                  className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  style={{
                    backgroundColor: 'var(--color-background-primary)',
                    borderColor: 'var(--color-border-primary)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>
              <div className="relative flex-1">
                <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
                <input
                  type="date"
                  placeholder="To"
                  value={value?.to || ''}
                  onChange={(e) => handleInputChange(field.key, { ...value, to: e.target.value })}
                  className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  style={{
                    backgroundColor: 'var(--color-background-primary)',
                    borderColor: 'var(--color-border-primary)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Check if any search values are active
  const hasActiveSearch = Object.values(searchValues).some(value => {
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v);
    }
    return value !== null && value !== undefined && value !== '';
  });

  return (
    <div className={`bg-gray-50 p-4 rounded-lg border mb-6 ${className}`}>
      {/* Main Search Row */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Primary Search Field */}
        {primaryField && renderSearchField(primaryField, searchValues[primaryField.key])}

        {/* Advanced Search Toggle */}
        {advancedFields.length > 0 && (
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4 mr-1" />
            {showAdvanced ? 'Simple Search' : 'Advanced Search'}
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Searching...' : 'Search'}
          </button>
          
          {hasActiveSearch && (
            <button
              onClick={handleClearAll}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Advanced Search Fields */}
      {showAdvanced && advancedFields.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4">
            {advancedFields.map(field => renderSearchField(field, searchValues[field.key]))}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveSearch && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">Active filters:</span>
            {Object.entries(searchValues)
              .filter(([_, value]) => {
                if (typeof value === 'object' && value !== null) {
                  return Object.values(value).some(v => v);
                }
                return value !== null && value !== undefined && value !== '';
              })
              .map(([key, value]) => {
                const field = config.searchFields.find(f => f.key === key);
                if (!field) return null;

                let displayValue = value;
                if (typeof value === 'object' && value !== null) {
                  const parts = [];
                  if (value.from) parts.push(`From: ${value.from}`);
                  if (value.to) parts.push(`To: ${value.to}`);
                  displayValue = parts.join(', ');
                } else if (field.options && field.type === 'select') {
                  const option = field.options.find(opt => opt.value?.toString() === value?.toString());
                  displayValue = option?.label || value;
                }

                return (
                  <button
                    key={key}
                    onClick={() => handleInputChange(key, '')}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <span>{field.label}: {displayValue}</span>
                    <X className="w-3 h-3" />
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
} 