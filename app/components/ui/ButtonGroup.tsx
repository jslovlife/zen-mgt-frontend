import React from 'react';

export interface ButtonConfig {
  label: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

export interface ButtonGroupProps {
  buttons: ButtonConfig[];
  className?: string;
  align?: 'left' | 'center' | 'right';
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  buttons,
  className = '',
  align = 'right',
  orientation = 'horizontal',
  size = 'md'
}) => {
  const getVariantStyles = (variant: ButtonConfig['variant']) => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-primary-600)',
          borderColor: 'var(--color-primary-600)',
          color: '#ffffff',
          hoverBg: 'var(--color-primary-700)',
          hoverBorder: 'var(--color-primary-700)'
        };
      case 'success':
        return {
          backgroundColor: 'var(--color-success-500)',
          borderColor: 'var(--color-success-500)',
          color: '#ffffff',
          hoverBg: 'var(--color-success-600)',
          hoverBorder: 'var(--color-success-600)'
        };
      case 'danger':
        return {
          backgroundColor: 'var(--color-danger-400)',
          borderColor: 'var(--color-danger-400)',
          color: '#ffffff',
          hoverBg: 'var(--color-danger-500)',
          hoverBorder: 'var(--color-danger-500)'
        };
      case 'warning':
        return {
          backgroundColor: 'var(--color-warning-500)',
          borderColor: 'var(--color-warning-500)',
          color: '#ffffff',
          hoverBg: 'var(--color-warning-600)',
          hoverBorder: 'var(--color-warning-600)'
        };
      case 'info':
        return {
          backgroundColor: 'var(--color-info-500)',
          borderColor: 'var(--color-info-500)',
          color: '#ffffff',
          hoverBg: 'var(--color-info-600)',
          hoverBorder: 'var(--color-info-600)'
        };
      default: // secondary
        return {
          backgroundColor: '#ffffff',
          borderColor: 'var(--color-primary-600)',
          color: 'var(--color-primary-600)',
          hoverBg: 'var(--color-primary-50)',
          hoverBorder: 'var(--color-primary-700)'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const alignmentClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }[align];

  const orientationClass = orientation === 'vertical' ? 'flex-col' : 'flex-row';
  const gapClass = orientation === 'vertical' ? 'gap-2' : 'gap-3';

  return (
    <div className={`flex ${orientationClass} ${alignmentClass} ${gapClass} pt-6 border-t border-gray-200 ${className}`}>
      {buttons.map((button, index) => {
        const styles = getVariantStyles(button.variant);
        const sizeStyles = getSizeStyles();

        return (
          <button
            key={index}
            type={button.type || 'button'}
            onClick={button.onClick}
            disabled={button.disabled || button.loading}
            className={`
              inline-flex items-center font-medium rounded-md border transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${sizeStyles}
            `}
            style={{
              backgroundColor: styles.backgroundColor,
              borderColor: styles.borderColor,
              color: styles.color,
              opacity: (button.disabled || button.loading) ? 0.6 : 1,
              cursor: (button.disabled || button.loading) ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!button.disabled && !button.loading) {
                e.currentTarget.style.backgroundColor = styles.hoverBg;
                e.currentTarget.style.borderColor = styles.hoverBorder;
              }
            }}
            onMouseLeave={(e) => {
              if (!button.disabled && !button.loading) {
                e.currentTarget.style.backgroundColor = styles.backgroundColor;
                e.currentTarget.style.borderColor = styles.borderColor;
              }
            }}
          >
            {button.loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2">{button.loadingText || 'Loading...'}</span>
              </>
            ) : (
              <>
                {button.icon && <span className="mr-2">{button.icon}</span>}
                {button.label}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ButtonGroup; 