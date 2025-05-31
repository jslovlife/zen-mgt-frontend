import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Filter, Search, X } from 'lucide-react';

interface DropdownOption {
  label: string;
  value: string;
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  className?: string;
  style?: React.CSSProperties;
  allowClear?: boolean;
  disabled?: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = 'Search options...',
  className = '',
  style,
  allowClear = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
            handleSelect(filteredOptions[focusedIndex].value);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          setFocusedIndex(-1);
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, focusedIndex, filteredOptions]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange('');
  };

  const handleButtonClick = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setFocusedIndex(-1);
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  // Highlight search term in option labels
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div 
      ref={dropdownRef} 
      className={`relative ${className}`} 
      style={{ ...style, position: 'relative', zIndex: 1 }}
    >
      {/* Filter Icon */}
      <Filter className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
      
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled}
        className={`search-input w-full pl-20 pr-12 py-2 text-left rounded-lg cursor-pointer transition-all flex items-center ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          borderColor: isOpen ? 'var(--color-primary-600)' : undefined,
          boxShadow: isOpen ? '0 0 0 2px rgba(147, 51, 234, 0.2)' : undefined
        }}
      >
        <span className={`flex-1 ${value ? 'text-gray-900' : 'text-gray-500'}`}>
          {displayValue}
        </span>
        
        {/* Clear button */}
        {allowClear && value && !disabled && (
          <X 
            className="absolute right-8 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            onClick={handleClear}
          />
        )}
        
        <ChevronDown 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            marginTop: '4px',
            backgroundColor: 'white',
            border: '1px solid var(--color-border-primary)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            zIndex: 99999,
            maxHeight: '300px',
            overflowY: 'auto',
            minWidth: '100%'
          }}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left transition-all duration-200 ${
                    index === focusedIndex ? 'bg-gray-100' : ''
                  }`}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: value === option.value 
                      ? 'var(--color-primary-100)' 
                      : index === focusedIndex 
                        ? 'var(--color-primary-50)' 
                        : 'white',
                    color: value === option.value 
                      ? 'var(--color-primary-800)' 
                      : index === focusedIndex
                        ? 'var(--color-primary-700)'
                        : 'var(--color-text-primary)',
                    border: 'none',
                    borderBottom: index < filteredOptions.length - 1 ? '1px solid var(--color-border-primary)' : 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: value === option.value ? '500' : '400'
                  }}
                  onMouseEnter={() => setFocusedIndex(index)}
                  onMouseLeave={() => setFocusedIndex(-1)}
                >
                  {highlightSearchTerm(option.label, searchTerm)}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No options found for "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown; 