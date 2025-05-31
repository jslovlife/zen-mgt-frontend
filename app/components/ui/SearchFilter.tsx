import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { ColumnConfig } from './DataTable';
import { CustomDropdown } from './CustomDropdown';

interface SearchFilterProps<T = any> {
  data: ColumnConfig<T>[];
  onSearch?: (searchValues: Record<string, string>) => void;
  className?: string;
}

export function SearchFilter<T extends Record<string, any>>({
  data: columns,
  onSearch,
  className = ''
}: SearchFilterProps<T>) {
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});

  // Get only searchable columns (those with searchable: true)
  const searchableColumns = columns.filter(col => col.searchable);
  
  // Get primary search column (first searchable column)
  const primarySearchColumn = searchableColumns[0];
  
  // Get filter columns (searchable columns with filterOptions)
  const filterColumns = searchableColumns.filter(col => col.filterOptions && col.filterOptions.length > 0);

  // Calculate optimal width for input based on placeholder text
  const getInputWidth = (text: string, isDropdown: boolean = false) => {
    // Base character width estimation (in rem)
    const charWidth = 0.6; // Approximate width per character
    const padding = 6; // Padding in rem (pl-20 + pr-4 + some buffer)
    const iconSpace = 2; // Space for icon
    
    const calculatedWidth = (text.length * charWidth) + padding + iconSpace;
    
    // Set constraints
    const minWidth = isDropdown ? 10 : 12; // Minimum width in rem
    const maxWidth = isDropdown ? 16 : 20; // Maximum width in rem
    
    const finalWidth = Math.max(minWidth, Math.min(maxWidth, calculatedWidth));
    
    return `${finalWidth}rem`;
  };

  // Handle search/filter input changes
  const handleInputChange = (columnKey: string, value: string) => {
    setSearchValues(prev => ({
      ...prev,
      [columnKey]: value
    }));
  };

  // Handle search button click
  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchValues);
    }
  };

  // Handle clear all
  const handleClearAll = () => {
    const clearedValues: Record<string, string> = {};
    searchableColumns.forEach(col => {
      clearedValues[col.key as string] = '';
    });
    setSearchValues(clearedValues);
    if (onSearch) {
      onSearch(clearedValues);
    }
  };

  // Initialize empty search values
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    searchableColumns.forEach(col => {
      initialValues[col.key as string] = '';
    });
    setSearchValues(initialValues);
  }, [columns]);

  // Don't render if no searchable columns
  if (searchableColumns.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gray-50 p-4 rounded-lg border mb-6 ${className}`} style={{ position: 'static', transform: 'none', overflow: 'visible' }}>
      <div className="flex flex-col md:flex-row gap-4" style={{ position: 'static', transform: 'none', overflow: 'visible' }}>
        {/* Primary Search Field */}
        {primarySearchColumn && (
          <div 
            className="flex-shrink-0"
            style={{ 
              width: getInputWidth(`Search ${primarySearchColumn.title.toLowerCase()}...`),
              overflow: 'visible',
              position: 'relative',
              zIndex: 1
            }}
          >
            <div className="relative" style={{ overflow: 'visible' }}>
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10 pointer-events-none" />
              <input
                type="text"
                placeholder={`Search ${primarySearchColumn.title.toLowerCase()}...`}
                value={searchValues[primarySearchColumn.key as string] || ''}
                onChange={(e) => handleInputChange(primarySearchColumn.key as string, e.target.value)}
                className="search-input w-full pl-20 pr-4 py-2 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Filter Dropdowns */}
        {filterColumns.map((column) => (
          <div 
            key={column.key as string} 
            className="flex-shrink-0"
            style={{ 
              width: getInputWidth(`All ${column.title}`, true),
              overflow: 'visible',
              position: 'relative',
              zIndex: 50
            }}
          >
            <CustomDropdown
              options={[
                { label: `All ${column.title}`, value: '' },
                ...(column.filterOptions?.map(opt => ({ label: opt.label, value: opt.value })) || [])
              ]}
              value={searchValues[column.key as string] || ''}
              onChange={(value) => handleInputChange(column.key as string, value)}
              placeholder={`All ${column.title}`}
              className="w-full"
            />
          </div>
        ))}

        {/* Additional Search Fields for Multiple Searchable Columns */}
        {searchableColumns.length > 1 && (
          <div className="flex gap-2">
            {searchableColumns.slice(1, 3).map((column) => ( // Show max 2 additional search fields
              !column.filterOptions && ( // Don't show if it's already a dropdown
                <div 
                  key={column.key as string} 
                  className="flex-shrink-0"
                  style={{ width: getInputWidth(`Search ${column.title.toLowerCase()}...`) }}
                >
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder={`Search ${column.title.toLowerCase()}...`}
                      value={searchValues[column.key as string] || ''}
                      onChange={(e) => handleInputChange(column.key as string, e.target.value)}
                      className="search-input w-full pl-20 pr-4 py-2 rounded-lg"
                    />
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {/* Search Button */}
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          <button
            onClick={handleClearAll}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {Object.entries(searchValues).some(([_, value]) => value) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700 mr-1">Active filters:</span>
          {Object.entries(searchValues)
            .filter(([_, value]) => value)
            .map(([key, value]) => {
              const column = searchableColumns.find(col => col.key === key);
              return (
                <button
                  key={key}
                  onClick={() => handleInputChange(key, '')}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-[var(--color-primary-600)] text-white text-sm font-medium rounded-lg border border-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] hover:border-[var(--color-primary-700)] transition-all duration-200 shadow-sm hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--color-primary-600)',
                    borderColor: 'var(--color-primary-600)',
                    color: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
                    e.currentTarget.style.borderColor = 'var(--color-primary-700)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                    e.currentTarget.style.borderColor = 'var(--color-primary-600)';
                  }}
                >
                  <span className="flex items-center gap-1">
                    <span className="font-medium">{column?.title}:</span>
                    <span className="font-normal">{value}</span>
                  </span>
                  <span className="text-white/80 hover:text-white text-lg leading-none ml-1">×</span>
                </button>
              );
            })}
          
          {/* Clear All Button */}
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <span>Clear all</span>
            <span className="text-gray-500 text-lg leading-none">×</span>
          </button>
        </div>
      )}
    </div>
  );
} 