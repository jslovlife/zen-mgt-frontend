import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    variant = 'default', 
    size = 'md', 
    className = '', 
    ...props 
  }, ref) => {
    return (
      <div className="input-wrapper">
        {label && (
          <label 
            htmlFor={props.id} 
            className="input-label"
          >
            {label}
            {props.required && <span className="input-required">*</span>}
          </label>
        )}
        
        <input
          ref={ref}
          className={`input-field input-${variant} input-${size} ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
        
        {error && (
          <p className="input-error-message">
            <svg 
              className="input-error-icon" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="input-helper-text">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input'; 