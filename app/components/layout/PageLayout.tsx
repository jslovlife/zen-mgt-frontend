import React from 'react';

export interface PageLayoutProps {
  title: string;
  icon?: React.ReactNode;
  addButtonText?: string;
  onAddClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  icon,
  addButtonText,
  onAddClick,
  children,
  className = ''
}) => {
  return (
    <div className={`p-2 sm:p-4 w-full min-h-screen ${className}`}>
      {/* Card Container */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 w-full relative">
        {/* Title and Add Button Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            {icon && <div className="w-6 h-6 text-gray-600">{icon}</div>}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
            </div>
          </div>
          
          {/* Optional Add Button */}
          {addButtonText && onAddClick && (
            <button
              onClick={onAddClick}
              className="bg-brand hover:bg-brand/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <span className="text-lg">+</span>
              {addButtonText}
            </button>
          )}
        </div>

        {/* Main Content */}
        {children}
      </div>
    </div>
  );
};

export default PageLayout; 