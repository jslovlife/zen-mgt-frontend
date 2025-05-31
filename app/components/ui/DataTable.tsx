import React, { useState, useCallback } from 'react';
import { Button } from './Button';
import { Search } from 'lucide-react';

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
  emptyText = 'No data available'
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
        return new Date(value as string | number | Date).toLocaleString();
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
      return cellValue?.toString().toLowerCase().includes(value.toLowerCase());
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
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
                          <input
                            type="text"
                            value={filterValues[column.key as string] || ''}
                            onChange={(e) => handleFilter(column.key as string, e.target.value)}
                            placeholder={`Filter ${column.title.toLowerCase()}...`}
                            className="search-input w-full pl-12 pr-4 py-2 rounded-lg"
                            style={{ height: '42px' }}
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
      </div>
    </div>
  );
} 