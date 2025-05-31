import React from 'react';
import { Link } from '@remix-run/react';

export interface BreadcrumbItem {
  name: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
}

const DefaultSeparator: React.FC = () => (
  <svg className="breadcrumb-separator" fill="currentColor" viewBox="0 0 20 20">
    <path 
      fillRule="evenodd" 
      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
      clipRule="evenodd" 
    />
  </svg>
);

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <DefaultSeparator />,
  className = ''
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className={`breadcrumbs ${className}`} aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = item.current || isLast;

          return (
            <li key={index} className="breadcrumb-item">
              {index > 0 && separator}
              {item.href && !isCurrent ? (
                <Link 
                  to={item.href} 
                  className="breadcrumb-link"
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ) : (
                <span 
                  className={`breadcrumb-text ${isCurrent ? 'breadcrumb-current' : ''}`}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {item.name}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb; 