import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = `btn-${size}`;
  const fullWidthClasses = fullWidth ? 'btn-full-width' : '';
  const loadingClasses = loading ? 'btn-loading' : '';
  const iconOnlyClasses = !children && (icon || loading) ? 'btn-icon-only' : '';
  
  const combinedClasses = [
    baseClasses,
    variantClasses,
    sizeClasses,
    fullWidthClasses,
    loadingClasses,
    iconOnlyClasses,
    className
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || loading;

  const renderIcon = () => {
    if (loading) {
      return (
        <svg className="btn-spinner" fill="none" viewBox="0 0 24 24">
          <circle
            className="btn-spinner-track"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="btn-spinner-path"
            fill="currentColor"
            d="m12 2a10 10 0 0 1 10 10h-2a8 8 0 0 0-8-8v-2z"
          />
        </svg>
      );
    }
    return icon;
  };

  return (
    <button
      className={combinedClasses}
      disabled={isDisabled}
      {...props}
    >
      {iconPosition === 'left' && renderIcon()}
      {children && <span className="btn-text">{children}</span>}
      {iconPosition === 'right' && renderIcon()}
    </button>
  );
};

export default Button; 