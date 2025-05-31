import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Filter } from 'lucide-react';

interface DropdownOption {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  className = '',
  style
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleButtonClick = () => {
    setIsOpen(!isOpen);
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  return (
    <div ref={dropdownRef} className={`relative ${className}`} style={{ ...style, position: 'relative', zIndex: 1 }}>
      {/* Filter Icon */}
      <Filter className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
      
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={handleButtonClick}
        className="search-input w-full pl-20 pr-12 py-2 text-left rounded-lg cursor-pointer transition-all flex items-center"
        style={{
          borderColor: isOpen ? 'var(--color-primary-600)' : undefined,
          boxShadow: isOpen ? '0 0 0 2px rgba(147, 51, 234, 0.2)' : undefined
        }}
      >
        <span className={`flex-1 ${value ? 'text-gray-900' : 'text-gray-500'}`}>
          {displayValue}
        </span>
        <ChevronDown 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu - Proper styling with theme colors */}
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
            maxHeight: '240px',
            overflowY: 'auto',
            minWidth: '100%'
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                backgroundColor: value === option.value ? 'var(--color-primary-100)' : 'white',
                color: value === option.value ? 'var(--color-primary-800)' : 'var(--color-text-primary)',
                border: 'none',
                borderBottom: '1px solid var(--color-border-primary)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: value === option.value ? '500' : '400',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-50)';
                  e.currentTarget.style.color = 'var(--color-primary-700)';
                }
              }}
              onMouseLeave={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 