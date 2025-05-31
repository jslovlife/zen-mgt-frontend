import React from 'react';
import { CustomDropdown } from './CustomDropdown';
import { SearchableDropdown } from './SearchableDropdown';

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'url' | 'password' | 'number' | 'textarea' | 'select' | 'searchable-select' | 'datetime-local' | 'date' | 'time';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
  className?: string;
  searchPlaceholder?: string;
  allowClear?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  options,
  rows = 4,
  className = '',
  searchPlaceholder,
  allowClear
}) => {
  const baseInputClass = `
    w-full px-3 py-2 border rounded-lg 
    focus:outline-none focus:ring-2 focus:ring-purple-500 
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-200
    ${error ? 'border-red-500' : 'border-gray-300'}
  `;

  const baseSelectClass = `
    search-input w-full px-3 py-2 border rounded-lg 
    focus:outline-none focus:ring-2 focus:ring-purple-500 
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-200 cursor-pointer
    ${error ? 'border-red-500' : 'border-gray-300'}
  `;

  const inputStyle = {
    height: '42px',
    backgroundColor: 'var(--color-background-primary)',
    borderColor: error ? '#ef4444' : 'var(--color-border-primary)',
    color: 'var(--color-text-primary)'
  };

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={`${baseInputClass} resize-vertical`}
            style={{
              backgroundColor: 'var(--color-background-primary)',
              borderColor: error ? '#ef4444' : 'var(--color-border-primary)',
              color: 'var(--color-text-primary)'
            }}
          />
        );

      case 'select':
        return (
          <SearchableDropdown
            options={options || []}
            value={value.toString()}
            onChange={onChange}
            placeholder={placeholder || `Select ${label.toLowerCase()}...`}
            className="w-full"
          />
        );

      case 'searchable-select':
        return (
          <SearchableDropdown
            options={options || []}
            value={value.toString()}
            onChange={onChange}
            placeholder={searchPlaceholder || `Search ${label.toLowerCase()}...`}
            allowClear={allowClear}
            className="w-full"
          />
        );

      default:
        return (
          <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={baseInputClass}
            style={inputStyle}
          />
        );
    }
  };

  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {renderInput()}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export interface FormProps {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  className?: string;
}

export const Form: React.FC<FormProps> = ({
  onSubmit,
  children,
  className = ''
}) => {
  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      {children}
    </form>
  );
};

// Helper function to create common field configurations
export const createFieldConfig = {
  text: (name: string, label: string, required = false): Partial<FormFieldProps> => ({
    name,
    label,
    type: 'text',
    required
  }),
  
  email: (name: string, label: string, required = false): Partial<FormFieldProps> => ({
    name,
    label,
    type: 'email',
    required
  }),
  
  url: (name: string, label: string, required = false): Partial<FormFieldProps> => ({
    name,
    label,
    type: 'url',
    required
  }),
  
  textarea: (name: string, label: string, rows = 4, required = false): Partial<FormFieldProps> => ({
    name,
    label,
    type: 'textarea',
    rows,
    required
  }),
  
  select: (name: string, label: string, options: Array<{ value: string; label: string }>, required = false): Partial<FormFieldProps> => ({
    name,
    label,
    type: 'select',
    options,
    required
  }),
  
  date: (name: string, label: string, required = false): Partial<FormFieldProps> => ({
    name,
    label,
    type: 'date',
    required
  }),
  
  datetime: (name: string, label: string, required = false): Partial<FormFieldProps> => ({
    name,
    label,
    type: 'datetime-local',
    required
  })
};

export default Form; 