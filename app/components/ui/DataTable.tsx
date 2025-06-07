import React, { useState, useCallback } from 'react';
import { Button } from './Button';
import { CustomDropdown } from './CustomDropdown';
import { Search } from 'lucide-react';
import { DateTimeUtil } from '~/utils/datetime.util';

// Action Button Component for table actions
export type ActionButtonVariant = 'info' | 'error' | 'success' | 'warning' | 'primary';

export interface ActionButtonProps {
  variant: ActionButtonVariant;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant,
  onClick,
  children,
  disabled = false,
  size = 'sm',
  className = ''
}) => {
  const getVariantColors = (variant: ActionButtonVariant) => {
    const colorMap = {
      info: {
        base: 'var(--color-info-500)',
        hover: 'var(--color-info-600)',
        focus: 'var(--color-info-300)'
      },
      error: {
        base: 'var(--color-error-500)',
        hover: 'var(--color-error-600)',
        focus: 'var(--color-error-300)'
      },
      success: {
        base: 'var(--color-success-500)',
        hover: 'var(--color-success-600)',
        focus: 'var(--color-success-300)'
      },
      warning: {
        base: 'var(--color-warning-500)',
        hover: 'var(--color-warning-600)',
        focus: 'var(--color-warning-300)'
      },
      primary: {
        base: 'var(--color-primary-600)',
        hover: 'var(--color-primary-700)',
        focus: 'var(--color-primary-400)'
      }
    };
    return colorMap[variant];
  };

  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-base';
  const colors = getVariantColors(variant);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center ${sizeClasses} font-medium transition-colors rounded-md ${className}`}
      style={{
        color: '#ffffff',
        backgroundColor: colors.base,
        borderColor: colors.base,
        border: '1px solid',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = colors.hover;
          e.currentTarget.style.borderColor = colors.hover;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = colors.base;
          e.currentTarget.style.borderColor = colors.base;
        }
      }}
      onFocus={(e) => {
        if (!disabled) {
          e.currentTarget.style.outline = 'none';
          e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.focus}`;
        }
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {children}
    </button>
  );
};

// Data types for column configuration
export type DataType = 'string' | 'number' | 'timestamp' | 'boolean';

export interface ColumnConfig<T = any> {
  key: keyof T;
  title: string;
  dataType: DataType;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  filterOptions?: Array<{ label: string; value: any }>;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: ColumnConfig<T>[];
  loading?: boolean;
  enableFilter?: boolean;
  enableSorter?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  rowKey?: keyof T | ((record: T) => string);
  className?: string;
  emptyText?: string;
  // External pagination support
  externalPagination?: {
    total: number;
    page: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    onSortChange?: (sortBy: string, sortDir: 'asc' | 'desc') => void;
  };
}

interface SortState {
  field: string | null;
  order: 'asc' | 'desc' | null;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  enableFilter = false,
  enableSorter = false,
  enablePagination = false,
  pageSize = 10,
  rowKey = 'id',
  className = '',
  emptyText = 'No data available',
  externalPagination
}: DataTableProps<T>) {
  // Filter out searchable-only columns for table display
  // Show columns that have filterable=true OR don't have searchable=true
  const displayColumns = columns.filter(col => col.filterable || !col.searchable);

  // States
  const [sortState, setSortState] = useState<SortState>({ field: null, order: null });
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Generate row key
  const getRowKey = useCallback((record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey]?.toString() || index.toString();
  }, [rowKey]);

  // Handle sorting
  const handleSort = (field: string) => {
    let newOrder: 'asc' | 'desc' | null = 'asc';
    
    if (sortState.field === field) {
      if (sortState.order === 'asc') {
        newOrder = 'desc';
      } else if (sortState.order === 'desc') {
        newOrder = null;
      }
    }

    setSortState({ field: newOrder ? field : null, order: newOrder });
  };

  // Handle filtering
  const handleFilter = (columnKey: string, value: string) => {
    setFilterValues(prev => ({
      ...prev,
      [columnKey]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Format value based on data type
  const formatValue = (value: any, dataType: DataType): string => {
    if (value === null || value === undefined) return '';
    
    switch (dataType) {
      case 'timestamp':
        return DateTimeUtil.forTableDateTime(value);
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value.toString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return value.toString();
    }
  };

  // Filter data
  const filteredData = data.filter(record => {
    return Object.entries(filterValues).every(([key, value]) => {
      if (!value) return true;
      
      const cellValue = record[key];
      if (cellValue === null || cellValue === undefined) return false;
      
      // Get the column configuration to check data type
      const column = displayColumns.find(col => col.key === key);
      
      // For timestamp fields, format both the cell value and filter value consistently
      if (column?.dataType === 'timestamp') {
        try {
          // Format the cell value using the same format as displayed in the table
          const formattedCellValue = DateTimeUtil.forTableDateTime(cellValue);
          // The filter value might be a partial datetime string, so normalize it
          const normalizedFilterValue = value.toLowerCase().trim();
          
          // Check if the formatted cell value includes the filter value
          return formattedCellValue.toLowerCase().includes(normalizedFilterValue);
        } catch (error) {
          // Fallback to string comparison if date parsing fails
          return cellValue.toString().toLowerCase().includes(value.toLowerCase());
        }
      }
      
      // For other data types, use the standard string comparison
      return cellValue.toString().toLowerCase().includes(value.toLowerCase());
    });
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortState.field || !sortState.order) return 0;
    
    const column = displayColumns.find(col => col.key === sortState.field);
    if (!column) return 0;

    const aValue = a[sortState.field];
    const bValue = b[sortState.field];
    
    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    let comparison = 0;
    switch (column.dataType) {
      case 'timestamp':
        comparison = new Date(aValue).getTime() - new Date(bValue).getTime();
        break;
      case 'number':
        comparison = Number(aValue) - Number(bValue);
        break;
      default:
        comparison = aValue.toString().localeCompare(bValue.toString());
    }
    
    return sortState.order === 'asc' ? comparison : -comparison;
  });

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = enablePagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  return (
    <div className={`data-table-component ${className}`}>
      <div className="data-table-container">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead className="data-table-header">
              <tr>
                {displayColumns.map((column) => (
                  <th
                    key={column.key as string}
                    className={`data-table-th ${column.sortable && enableSorter ? 'sortable' : ''}`}
                    style={{ 
                      width: column.width, 
                      cursor: column.sortable && enableSorter ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                      if (column.sortable && enableSorter) {
                        handleSort(column.key as string);
                      }
                    }}
                  >
                    <span>{column.title}</span>
                    {column.sortable && enableSorter && (
                      <span style={{ marginLeft: '8px' }}>
                        {sortState.field === column.key && sortState.order === 'asc' && '↑'}
                        {sortState.field === column.key && sortState.order === 'desc' && '↓'}
                        {sortState.field !== column.key && '↕'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
              {enableFilter && (
                <tr className="filter-row">
                  {displayColumns.map((column) => (
                    <th key={column.key as string} className="data-table-th filter-cell" style={{ 
                      padding: '12px 8px', 
                      position: 'relative', 
                      overflow: 'visible'
                    }}>
                      {column.filterable && (
                        <div className="relative">
                          <input
                            type="text"
                            value={filterValues[column.key as string] || ''}
                            onChange={(e) => handleFilter(column.key as string, e.target.value)}
                            placeholder={`Filter ${column.title.toLowerCase()}...`}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                            style={{ 
                              height: '42px',
                              backgroundColor: 'var(--color-background-primary)',
                              borderColor: 'var(--color-border-primary)',
                              color: 'var(--color-text-primary)'
                            }}
                          />
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              )}
            </thead>
            
            <tbody className="data-table-body">
              {loading ? (
                <tr>
                  <td colSpan={displayColumns.length} className="loading-cell">
                    <div className="loading-content">
                      <div className="loading-spinner"></div>
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={displayColumns.length} className="empty-cell">
                    <div className="empty-content">
                      <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <span>{emptyText}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((record, index) => (
                  <tr key={getRowKey(record, index)} className="data-table-row">
                    {displayColumns.map((column) => (
                      <td key={column.key as string} className="data-table-td">
                        {column.render
                          ? column.render(record[column.key], record, index)
                          : formatValue(record[column.key], column.dataType)
                        }
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {enablePagination && totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {((currentPage - 1) * pageSize) + 1} to{' '}
              {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
              {sortedData.length} entries
            </div>
            
            <div className="pagination-controls">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  return page === 1 || page === totalPages ||
                         (page >= currentPage - 2 && page <= currentPage + 2);
                })
                .map((page, index, array) => {
                  const showEllipsis = index > 0 && array[index - 1] !== page - 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="pagination-ellipsis">...</span>}
                      <Button
                        variant={currentPage === page ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  );
                })}
              
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* External Backend Pagination Controls */}
        {externalPagination && (
          <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
            {/* Left: Results info and page size */}
            <div className="flex items-center space-x-6">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{externalPagination.total}</span> items
                {externalPagination.total > 0 && (
                  <span className="ml-2">
                    (page {externalPagination.page} of {externalPagination.totalPages})
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Show:</label>
                <CustomDropdown
                  value={externalPagination.pageSize.toString()}
                  onChange={(value) => {
                    console.log('🔧 PageSize Dropdown DEBUG:', { 
                      selectedValue: value, 
                      selectedValueType: typeof value,
                      currentPageSize: externalPagination.pageSize,
                      currentPageSizeType: typeof externalPagination.pageSize,
                      currentPageSizeString: externalPagination.pageSize.toString(),
                      parsedValue: parseInt(value),
                      willCall: 'onPageSizeChange'
                    });
                    externalPagination.onPageSizeChange(parseInt(value));
                  }}
                  placeholder="Page Size"
                  options={[
                    { label: '10', value: '10' },
                    { label: '20', value: '20' },
                    { label: '50', value: '50' },
                    { label: '100', value: '100' }
                  ]}
                  className="w-28"
                  style={{ minWidth: '112px', height: '42px' }}
                />
              </div>
            </div>

            {/* Center: Sorting controls */}
            {externalPagination.onSortChange && (
              <div className="flex items-center space-x-3">
                <label className="text-sm text-gray-600">Sort:</label>
                <CustomDropdown
                  value={externalPagination.sortBy || ''}
                  onChange={(value) => {
                    console.log('🔧 DataTable Sort Dropdown onChange:', { 
                      selectedValue: value, 
                      currentSortBy: externalPagination.sortBy,
                      currentSortDir: externalPagination.sortDir,
                      valueType: typeof value 
                    });
                    externalPagination.onSortChange!(value, externalPagination.sortDir || 'asc');
                  }}
                  placeholder="Sort By"
                  options={[
                    { label: 'User Code', value: 'userCode' },
                    { label: 'Username', value: 'username' },
                    { label: 'First Name', value: 'firstName' },
                    { label: 'Last Name', value: 'lastName' },
                    { label: 'Email', value: 'email' },
                    { label: 'Created Date', value: 'createdAt' },
                    { label: 'Last Login', value: 'lastLoginAt' }
                  ]}
                  className="w-48"
                  style={{ minWidth: '192px', height: '42px' }}
                />
                
                <button
                  onClick={() => {
                    externalPagination.onSortChange!(
                      externalPagination.sortBy || 'userCode',
                      externalPagination.sortDir === 'asc' ? 'desc' : 'asc'
                    );
                  }}
                  className="px-3 py-1 text-sm bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-purple-700 disabled:opacity-50"
                  style={{ height: '42px' }}
                  disabled={loading}
                >
                  {externalPagination.sortDir === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            )}
            
            {/* Right: Navigation controls - Always show when external pagination is enabled */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  externalPagination.onPageChange(1);
                }}
                disabled={externalPagination.page <= 1 || loading}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ««
              </button>
              
              <button
                onClick={() => {
                  externalPagination.onPageChange(externalPagination.page - 1);
                }}
                disabled={externalPagination.page <= 1 || loading}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ‹
              </button>
              
              <span className="px-4 py-1 text-sm font-medium text-white bg-purple-600 border-t border-b border-purple-600">
                {externalPagination.page}
              </span>
              
              <button
                onClick={() => {
                  externalPagination.onPageChange(externalPagination.page + 1);
                }}
                disabled={externalPagination.page >= externalPagination.totalPages || loading}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ›
              </button>
              
              <button
                onClick={() => {
                  externalPagination.onPageChange(externalPagination.totalPages);
                }}
                disabled={externalPagination.page >= externalPagination.totalPages || loading}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                »»
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 