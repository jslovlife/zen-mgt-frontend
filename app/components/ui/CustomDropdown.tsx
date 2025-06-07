import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debug incoming props
  console.log('🔧 CustomDropdown render with props:', {
    value,
    placeholder,
    optionsCount: options.length,
    options: options.map(opt => `${opt.label}:${opt.value}`),
    selectedOption: options.find(opt => opt.value === value)
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      console.log('🔧 CustomDropdown click outside check:', {
        isOpen,
        hasButtonRef: !!buttonRef.current,
        hasDropdownRef: !!dropdownRef.current,
        buttonContainsTarget: buttonRef.current?.contains(target),
        dropdownContainsTarget: dropdownRef.current?.contains(target),
        targetTagName: (target as Element)?.tagName,
        targetTextContent: (target as Element)?.textContent?.trim()
      });
      
      // Don't close if clicking on button or dropdown content
      if (buttonRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
        console.log('🔧 CustomDropdown NOT closing - click is on button or dropdown content');
        return;
      }
      
      console.log('🔧 CustomDropdown closing due to click outside');
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Calculate optimal dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const dropdownHeight = Math.min(options.length * 44 + 40, 280); // Estimate dropdown height
      
      // Show above if not enough space below
      const shouldShowAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      setDropdownPosition(shouldShowAbove ? 'above' : 'below');
    }
  }, [isOpen, options.length]);

  const handleSelect = (optionValue: string) => {
    console.log('🔧 CustomDropdown handleSelect called:', { 
      optionValue, 
      currentValue: value,
      willTriggerOnChange: true 
    });
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleButtonClick = () => {
    console.log('🔧 CustomDropdown button clicked, isOpen will be:', !isOpen);
    setIsOpen(!isOpen);
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  console.log('🔧 CustomDropdown computed values:', {
    selectedOption: selectedOption ? `${selectedOption.label}:${selectedOption.value}` : 'null',
    displayValue,
    isOpen
  });

  // Get button position for portal
  const getDropdownStyle = (): React.CSSProperties => {
    if (!buttonRef.current) return {};
    
    const rect = buttonRef.current.getBoundingClientRect();
    
    return {
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 999999,
      maxHeight: '280px',
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      overflowY: 'auto',
      ...(dropdownPosition === 'above' ? {
        bottom: window.innerHeight - rect.top + 4,
      } : {
        top: rect.bottom + 4,
      }),
    };
  };

  // Portal dropdown content
  const dropdownContent = isOpen ? (
    <div ref={dropdownRef} style={getDropdownStyle()}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            console.log('🔧 CustomDropdown OPTION CLICKED:', {
              optionLabel: option.label,
              optionValue: option.value,
              currentValue: value,
              willCallHandleSelect: true
            });
            handleSelect(option.value);
          }}
          onMouseDown={(e) => {
            console.log('🔧 CustomDropdown OPTION MOUSE DOWN:', {
              optionLabel: option.label,
              optionValue: option.value
            });
          }}
          style={{
            width: '100%',
            padding: '12px 16px',
            textAlign: 'left',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: options.indexOf(option) < options.length - 1 ? '1px solid #e5e7eb' : 'none',
            backgroundColor: value === option.value ? '#ede9fe' : 'white',
            color: value === option.value ? '#7c3aed' : '#111827',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (value !== option.value) {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }
          }}
          onMouseLeave={(e) => {
            if (value !== option.value) {
              e.currentTarget.style.backgroundColor = 'white';
            }
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Filter Icon */}
      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
      
      {/* Dropdown Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        className="w-full pl-8 pr-10 py-2 text-left rounded-lg cursor-pointer transition-all flex items-center border border-gray-300 bg-white hover:border-purple-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
        style={{
          height: '42px',
          fontSize: '14px',
          color: selectedOption ? '#1f2937' : '#6b7280',
          borderColor: isOpen ? '#9333ea' : '#d1d5db',
          boxShadow: isOpen ? '0 0 0 2px rgba(147, 51, 234, 0.2)' : 'none'
        }}
      >
        <span className="flex-1 truncate">
          {displayValue}
        </span>
        <ChevronDown 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Portal dropdown to document body */}
      {typeof document !== 'undefined' && createPortal(
        dropdownContent,
        document.body
      )}
    </div>
  );
}; 