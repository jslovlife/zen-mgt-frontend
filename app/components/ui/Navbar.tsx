import React from 'react';
import { Button } from './Button';
import { getNavigationConfig, type NavSection } from '../../config/routes';

export interface NavItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

// Unified item type for internal use
interface UnifiedNavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

export interface SideNavbarProps {
  title: string;
  items?: NavItem[]; // Keep for backward compatibility
  sections?: NavSection[]; // New sections-based approach
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  activeModule?: string;
}

export const SideNavbar: React.FC<SideNavbarProps> = ({
  title,
  items,
  sections,
  isOpen,
  onClose,
  className = '',
  activeModule
}) => {
  // Convert sections to use unified item type
  const convertSectionsToUnified = (sections: NavSection[]) => {
    return sections.map(section => ({
      title: section.title,
      items: section.items.map(item => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        onClick: undefined,
        active: activeModule === item.key
      }))
    }));
  };

  // Use sections if provided, otherwise fall back to items, or auto-generate from routes
  const navigationSections = sections 
    ? convertSectionsToUnified(sections)
    : items 
    ? [{ 
        title: 'Navigation', 
        items: items.map(item => ({
          key: item.id,
          label: item.name,
          icon: item.icon,
          onClick: item.onClick,
          active: item.active
        })) 
      }] 
    : convertSectionsToUnified(getNavigationConfig(activeModule));

  const handleItemClick = (item: UnifiedNavItem) => {
    if (item.onClick) {
      item.onClick();
    }
    onClose(); // Close mobile sidebar after selection
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${className}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <h1 className="sidebar-title">{title}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="sidebar-close-btn lg:hidden"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          />
        </div>

        <nav className="sidebar-nav">
          {navigationSections.map((section) => (
            <div key={section.title} className="sidebar-nav-section">
              <h3 className="sidebar-nav-title">{section.title}</h3>
              <ul className="sidebar-nav-list">
                {section.items.map((item) => (
                  <li key={item.key}>
                    <button
                      onClick={() => handleItemClick(item)}
                      className={`sidebar-nav-item ${item.active ? 'sidebar-nav-item-active' : ''}`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
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