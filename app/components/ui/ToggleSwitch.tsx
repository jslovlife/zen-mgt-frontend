import React from 'react';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  activeText?: string;
  inactiveText?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  activeText = 'Active',
  inactiveText = 'Inactive',
  disabled = false,
  size = 'md',
  className = ''
}) => {
  // Size configurations
  const sizeClasses = {
    sm: {
      container: 'h-6 w-16',
      slider: 'h-4 w-4',
      translate: checked ? 'translate-x-10' : 'translate-x-1',
      text: 'text-xs'
    },
    md: {
      container: 'h-8 w-20',
      slider: 'h-6 w-6',
      translate: checked ? 'translate-x-12' : 'translate-x-1',
      text: 'text-xs'
    },
    lg: {
      container: 'h-10 w-24',
      slider: 'h-8 w-8',
      translate: checked ? 'translate-x-14' : 'translate-x-1',
      text: 'text-sm'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className="flex items-center">
      <div 
        onClick={disabled ? undefined : onChange}
        className={`
          relative inline-flex items-center rounded-full transition-colors duration-200 
          ${currentSize.container}
          ${disabled 
            ? 'cursor-not-allowed opacity-50' 
            : 'cursor-pointer focus:outline-none focus:ring-4 focus:ring-purple-300'
          }
          ${checked 
            ? 'bg-purple-600 hover:bg-purple-700' 
            : 'bg-gray-300 hover:bg-gray-400'
          }
          ${disabled && (checked ? 'hover:bg-purple-600' : 'hover:bg-gray-300')}
          ${className}
        `}
      >
        {/* Slider circle */}
        <span
          className={`
            inline-block transform bg-white rounded-full shadow-sm transition-transform duration-200 
            ${currentSize.slider}
            ${currentSize.translate}
          `}
        />
        
        {/* Active text - shown on left when toggle is on */}
        <span className={`
          absolute left-2 font-medium transition-opacity duration-200 
          ${currentSize.text}
          ${checked 
            ? 'text-white opacity-100' 
            : 'text-transparent opacity-0'
          }
        `}>
          {activeText}
        </span>
        
        {/* Inactive text - shown on right when toggle is off */}
        <span className={`
          absolute right-2 font-medium transition-opacity duration-200 
          ${currentSize.text}
          ${!checked 
            ? 'text-gray-700 opacity-100' 
            : 'text-transparent opacity-0'
          }
        `}>
          {inactiveText}
        </span>
      </div>
    </div>
  );
}; 