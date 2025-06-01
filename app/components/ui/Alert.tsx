import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface AlertProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'warning':
      case 'confirm':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-600" />;
      default:
        return null;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          title: 'text-green-800',
          message: 'text-green-700'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          title: 'text-red-800',
          message: 'text-red-700'
        };
      case 'warning':
      case 'confirm':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          title: 'text-yellow-800',
          message: 'text-yellow-700'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          title: 'text-blue-800',
          message: 'text-blue-700'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          title: 'text-gray-800',
          message: 'text-gray-700'
        };
    }
  };

  const colors = getColors();

  const handleConfirm = () => {
    onConfirm?.();
    // Don't automatically close - let the onConfirm callback control the next step
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center pt-16 p-4">
        {/* Alert Modal */}
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 h-fit">
          {/* Header */}
          <div className={`px-6 py-4 border-b ${colors.border} ${colors.bg} rounded-t-lg`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getIcon()}
                <h3 className={`text-lg font-semibold ${colors.title}`}>
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className={`text-sm ${colors.message} leading-relaxed`}>
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
            {type === 'confirm' ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium rounded-md border transition-colors"
                  style={{
                    color: 'var(--color-primary-600)',
                    backgroundColor: '#ffffff',
                    borderColor: 'var(--color-primary-600)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-50)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm font-medium text-white rounded-md border transition-colors"
                  style={{
                    backgroundColor: 'var(--color-danger-400)',
                    borderColor: 'var(--color-danger-400)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-danger-500)';
                    e.currentTarget.style.borderColor = 'var(--color-danger-500)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-danger-400)';
                    e.currentTarget.style.borderColor = 'var(--color-danger-400)';
                  }}
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary-600)',
                  borderColor: 'var(--color-primary-600)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                }}
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Alert; 