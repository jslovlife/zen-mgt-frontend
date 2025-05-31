import React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { useNavigate } from '@remix-run/react';

export interface BackButtonProps {
  /** Custom click handler - if not provided, uses browser back */
  onClick?: () => void;
  /** Custom navigation path */
  to?: string;
  /** Button style variant */
  variant?: 'default' | 'minimal' | 'close' | 'theme';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Position the button */
  position?: 'static' | 'absolute' | 'fixed';
  /** Custom className */
  className?: string;
  /** Custom label text */
  label?: string;
  /** Show/hide the label text */
  showLabel?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  to,
  variant = 'default',
  size = 'md',
  position = 'static',
  className = '',
  label = 'Back',
  showLabel = true,
  disabled = false
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (disabled) return;
    
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1); // Browser back
    }
  };

  // Icon selection based on variant
  const Icon = variant === 'close' ? X : ArrowLeft;

  // Size classes
  const sizeClasses = {
    sm: 'p-2 text-sm',
    md: 'p-2 text-base',
    lg: 'p-3 text-lg'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Variant styles
  const getVariantStyles = () => {
    const baseTransition = 'transition-all duration-200';
    
    switch (variant) {
      case 'theme':
        return {
          className: `${baseTransition} rounded-md border shadow-sm`,
          style: {
            color: '#ffffff',
            backgroundColor: 'var(--color-primary-600)',
            borderColor: 'var(--color-primary-600)'
          },
          hoverStyle: {
            color: '#ffffff',
            backgroundColor: 'var(--color-primary-700)',
            borderColor: 'var(--color-primary-700)'
          }
        };

      case 'minimal':
        return {
          className: `${baseTransition} text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full border border-gray-200 hover:border-gray-300 shadow-sm`,
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)'
          }
        };
      
      case 'close':
        return {
          className: `${baseTransition} text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full`,
          style: {}
        };
      
      default: // 'default'
        return {
          className: `${baseTransition} rounded-md border`,
          style: {
            color: 'var(--color-text-secondary)',
            backgroundColor: 'var(--color-background-primary)',
            borderColor: 'var(--color-border-primary)'
          },
          hoverStyle: {
            backgroundColor: 'var(--color-background-hover)',
            borderColor: 'var(--color-border-secondary)'
          }
        };
    }
  };

  // Position classes
  const positionClasses = {
    static: '',
    absolute: 'absolute top-4 right-4',
    fixed: 'fixed top-4 right-4 z-50'
  };

  const variantConfig = getVariantStyles();

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center
        ${sizeClasses[size]}
        ${variantConfig.className}
        ${positionClasses[position]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={variantConfig.style}
      onMouseEnter={(e) => {
        if (!disabled && variantConfig.hoverStyle) {
          Object.assign(e.currentTarget.style, variantConfig.hoverStyle);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && variantConfig.style) {
          Object.assign(e.currentTarget.style, variantConfig.style);
        }
      }}
      title={variant === 'close' ? 'Close' : label}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && variant !== 'close' && (
        <span className="ml-2">{label}</span>
      )}
    </button>
  );
}; 