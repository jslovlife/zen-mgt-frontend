import React from 'react';
import { Link } from '@remix-run/react';
import { Button } from './Button';

export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  path?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface SideNavbarProps {
  title: string;
  sections: NavSection[];
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const SideNavbar: React.FC<SideNavbarProps> = ({
  title,
  sections,
  isOpen,
  onClose,
  className = ''
}) => {
  const handleItemClick = (item: NavItem) => {
    // Close mobile sidebar after selection
    onClose();
    
    // Call onClick if provided (for any additional logic)
    if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${className}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <h1 className="sidebar-title">{title}</h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sections.map((section, sectionIndex) => (
            <div key={`section-${sectionIndex}`} className="sidebar-nav-section">
              <h3 className="sidebar-nav-title">{section.title}</h3>
              <ul className="sidebar-nav-list">
                {section.items.map((item) => (
                  <li key={item.key}>
                    {item.path ? (
                      <Link
                        to={item.path}
                        onClick={() => handleItemClick(item)}
                        className={`sidebar-nav-item ${item.active ? 'sidebar-nav-item-active' : ''}`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleItemClick(item)}
                        className={`sidebar-nav-item ${item.active ? 'sidebar-nav-item-active' : ''}`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default SideNavbar; 