import React from 'react';
import { BackButton, BackButtonProps } from './BackButton';

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Card title */
  title?: string;
  /** Card subtitle */
  subtitle?: string;
  /** Show back button */
  showBackButton?: boolean;
  /** Back button configuration */
  backButtonProps?: Partial<BackButtonProps>;
  /** Custom header content */
  headerContent?: React.ReactNode;
  /** Custom footer content */
  footerContent?: React.ReactNode;
  /** Card padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Card border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Card shadow */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  showBackButton = false,
  backButtonProps = {},
  headerContent,
  footerContent,
  padding = 'md',
  rounded = 'lg',
  shadow = 'md',
  className = '',
  style = {}
}) => {
  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  // Border radius classes
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl'
  };

  // Shadow classes
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const hasHeader = title || subtitle || headerContent || showBackButton;

  return (
    <div
      className={`
        bg-white border border-gray-200 relative
        ${paddingClasses[padding]}
        ${roundedClasses[rounded]}
        ${shadowClasses[shadow]}
        ${className}
      `}
      style={{
        backgroundColor: 'var(--color-background-primary)',
        borderColor: 'var(--color-border-primary)',
        ...style
      }}
    >
      {/* Back Button - positioned absolute in top right */}
      {showBackButton && (
        <BackButton
          position="absolute"
          variant="minimal"
          size="sm"
          showLabel={false}
          {...backButtonProps}
        />
      )}

      {/* Header */}
      {hasHeader && (
        <div className={`${showBackButton ? 'pr-12' : ''} ${padding !== 'none' ? 'mb-6' : ''}`}>
          {(title || subtitle) && (
            <div>
              {title && (
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {headerContent && (
            <div className={title || subtitle ? 'mt-4' : ''}>
              {headerContent}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={hasHeader && padding !== 'none' ? 'flex-1' : ''}>
        {children}
      </div>

      {/* Footer */}
      {footerContent && (
        <div className={`${padding !== 'none' ? 'mt-6 pt-6 border-t border-gray-200' : ''}`}>
          {footerContent}
        </div>
      )}
    </div>
  );
};

// Convenience wrapper for form cards
export const FormCard: React.FC<Omit<CardProps, 'showBackButton'> & { 
  onBack?: () => void;
  backTo?: string;
  showBackButton?: boolean;
}> = ({ 
  onBack, 
  backTo, 
  showBackButton = true,
  ...props 
}) => (
  <Card
    {...props}
    showBackButton={showBackButton}
    backButtonProps={{
      onClick: onBack,
      to: backTo,
      variant: 'minimal',
      size: 'sm',
      ...props.backButtonProps
    }}
  />
); 