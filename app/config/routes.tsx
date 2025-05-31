import React from 'react';
import { 
  Users, 
  Building2, 
  Shield, 
  CreditCard, 
  Banknote, 
  BarChart3, 
  Settings, 
  Calendar,
  Menu,
  Code,
  Home
} from 'lucide-react';

/**
 * UNIFIED NAVIGATION CONFIGURATION
 * 
 * Single source of truth for all navigation, routes, and sections.
 * Everything is defined in one place for maximum maintainability.
 * 
 * To add a new route:
 * 1. Add it to the appropriate section in NAVIGATION_CONFIG
 * 2. That's it! Everything else auto-updates
 * 
 * To add a new section:
 * 1. Add a new section object with title, order, and routes
 * 2. Everything auto-generates from this single config
 */

export const NAVIGATION_CONFIG = {
  sections: {
    'DASHBOARD': {
      title: 'Dashboard',
      order: 0,
      routes: {
        'dashboard': {
          title: 'Dashboard',
          description: 'Manage dashboard',
          addButtonText: 'Add Dashboard',
          icon: <Home className="w-5 h-5" />,
          path: '/dashboard'
        }
      }
    },
    'SITE': {
      title: 'Site Management',
      order: 1,
      routes: {
        'site-management': {
          title: 'Site Management',
          description: 'Manage merchant sites',
          addButtonText: 'Add Site',
          icon: <Building2 className="w-5 h-5" />,
          path: '/dashboard/site/site-management'
        },
        'site-pay-platform': {
          title: 'Site Pay Platform', 
          description: 'Manage site payment platforms',
          addButtonText: 'Add Site Pay Platform',
          icon: <CreditCard className="w-5 h-5" />,
          path: '/dashboard/site/site-pay-platform'
        },
        'site-withdraw-platform': {
          title: 'Site Withdraw Platform',
          description: 'Manage site withdrawal platforms',
          addButtonText: 'Add Site Withdraw Platform',
          icon: <Banknote className="w-5 h-5" />,
          path: '/dashboard/site/site-withdraw-platform'
        }
      }
    },
    'THIRD PARTY': {
      title: 'Third Party',
      order: 2,
      routes: {
        'payment-platform': {
          title: 'Payment Platform',
          description: 'Manage third party payment platforms',
          addButtonText: 'Add Payment Platform',
          icon: <CreditCard className="w-5 h-5" />,
          path: '/dashboard/third-party/payment-platform'
        },
        'withdraw-platform': {
          title: 'Withdraw Platform',
          description: 'Manage third party withdrawal platforms',
          addButtonText: 'Add Withdraw Platform',
          icon: <Banknote className="w-5 h-5" />,
          path: '/dashboard/third-party/withdraw-platform'
        },
        'payment-platform-channel': {
          title: 'Payment Platform Channel',
          description: 'Manage third party payment platform channels',
          addButtonText: 'Add Payment Platform Channel',
          icon: <CreditCard className="w-5 h-5" />,
          path: '/dashboard/third-party/payment-platform-channel'
        },
        'withdraw-platform-channel': {
          title: 'Withdraw Platform Channel',
          description: 'Manage third party withdrawal platform channels',
          addButtonText: 'Add Withdraw Platform Channel',
          icon: <Banknote className="w-5 h-5" />,
          path: '/dashboard/third-party/withdraw-platform-channel'
        },
        'api-template': {
          title: 'API Template',
          description: 'Manage third party API templates',
          addButtonText: 'Add API Template',
          icon: <Code className="w-5 h-5" />,
          path: '/dashboard/third-party/api-template'
        }
      }
    },
    'ORDERS': {
      title: 'Orders', 
      order: 3,
      routes: {
        'payment-order': {
          title: 'Payment Orders',
          description: 'Manage and track payment orders',
          addButtonText: 'Create Order',
          icon: <CreditCard className="w-5 h-5" />,
          path: '/dashboard/orders/payment-order'
        },
        'withdraw-order': {
          title: 'Withdraw Orders',
          description: 'Manage and track withdrawal orders',
          addButtonText: 'Create Withdrawal',
          icon: <Banknote className="w-5 h-5" />,
          path: '/dashboard/orders/withdraw-order'
        }
      }
    },
    'CONFIGURATION': {
      title: 'Configuration',
      order: 4,
      routes: {
        'payment-type': {
          title: 'Payment Type',
          description: 'Manage payment types',
          addButtonText: 'Add Payment Type',
          icon: <CreditCard className="w-5 h-5" />,
          path: '/dashboard/configuration/payment-type'
        },
        'currency-list': {
          title: 'Currency List',
          description: 'Manage currency list',
          addButtonText: 'Add Currency',
          icon: <CreditCard className="w-5 h-5" />,
          path: '/dashboard/configuration/currency-list'
        },
        'bank-list': {
          title: 'Bank List',
          description: 'Manage bank list',
          addButtonText: 'Add Bank',
          icon: <Banknote className="w-5 h-5" />,
          path: '/dashboard/configuration/bank-list'
        },
        'platform-bank-list': {
          title: 'Platform Bank List',
          description: 'Manage platform bank list',
          addButtonText: 'Add Platform Bank',
          icon: <Banknote className="w-5 h-5" />,
          path: '/dashboard/configuration/platform-bank-list'
        }
      }
    },
    'TOOLS': {
      title: 'Tools',
      order: 6,
      routes: {
        'api-test': {
          title: 'API Test',
          description: 'Test API endpoints',
          addButtonText: 'Create Test',
          icon: <Code className="w-5 h-5" />,
          path: '/dashboard/api-test'
        },
        'reports': {
          title: 'Reports', 
          description: 'View and generate system reports',
          addButtonText: 'Generate Report',
          icon: <BarChart3 className="w-5 h-5" />,
          path: '/dashboard/tools/reports'
        }
      }
    },
    'USER ADMINISTRATION': {
      title: 'User Administration',
      order: 7,
      routes: {
        'user-management': {
          title: 'User Management',
          description: 'Manage system users, roles, and permissions',
          addButtonText: 'Add User',
          icon: <Users className="w-5 h-5" />,
          path: '/dashboard/user-administration/user-management'
        },
        'user-group-management': {
          title: 'User Group Management', 
          description: 'Manage user groups',
          addButtonText: 'Add User Group',
          icon: <Building2 className="w-5 h-5" />,
          path: '/dashboard/user-administration/user-group-management'
        },
        'resource-management': {
          title: 'Resource Management',
          description: 'Manage resources',
          addButtonText: 'Add Resource',
          icon: <Menu className="w-5 h-5" />,
          path: '/dashboard/user-administration/menu-management'
        }
      }
    },
    'SYSTEM ADMINISTRATION': {
      title: 'System Administration',
      order: 8,
      routes: {
        'system-parameter': {
          title: 'System Parameter',
          description: 'System configuration and preferences', 
          addButtonText: 'Add System Parameter',
          icon: <Settings className="w-5 h-5" />,
          path: '/dashboard/settings'
        },
        'system-schedule-job': {
          title: 'System Schedule Job',
          description: 'Manage system schedule jobs',
          addButtonText: 'Add System Schedule Job',
          icon: <Calendar className="w-5 h-5" />,
          path: '/dashboard/system-administration/system-schedule-job'
        }
      }
    }
  }
} as const;

// Auto-generated flat route config for backward compatibility
export const ROUTE_CONFIG = Object.fromEntries(
  Object.entries(NAVIGATION_CONFIG.sections).flatMap(([sectionKey, section]) =>
    Object.entries(section.routes).map(([routeKey, route]) => [
      routeKey,
      { ...route, section: sectionKey }
    ])
  )
);

// Auto-generated section config for backward compatibility
export const SECTION_CONFIG = Object.fromEntries(
  Object.entries(NAVIGATION_CONFIG.sections).map(([key, section]) => [
    key,
    { title: section.title, order: section.order }
  ])
);

// Auto-generated exports from configuration
export const Routes = {
  dashboard: '/dashboard',
  ...Object.fromEntries(
    Object.entries(ROUTE_CONFIG).map(([key, config]) => [
      key.replace('-', ''), // userManagement, siteManagement, etc.
      config.path
    ])
  )
};

export const NavigationIcons = Object.fromEntries(
  Object.entries(ROUTE_CONFIG).map(([key, config]) => [key, config.icon])
);

export const ModuleMetadata = Object.fromEntries(
  Object.entries(ROUTE_CONFIG).map(([key, config]) => [
    key, 
    {
      title: config.title,
      description: config.description, 
      addButtonText: config.addButtonText
    }
  ])
);

// Types
export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Auto-generate navigation from unified config
export function getNavigationConfig(activeModule?: string): NavSection[] {
  return Object.entries(NAVIGATION_CONFIG.sections)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([sectionKey, section]) => ({
      title: section.title,
      items: Object.entries(section.routes).map(([routeKey, route]) => ({
        key: routeKey,
        label: route.title,
        icon: route.icon,
        path: route.path,
        active: activeModule === routeKey
      }))
    }));
}

// Auto-generate breadcrumbs from config
export function getBreadcrumbConfig(activeModule: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: Routes.dashboard }
  ];

  const moduleConfig = ROUTE_CONFIG[activeModule as keyof typeof ROUTE_CONFIG];
  if (moduleConfig) {
    breadcrumbs.push({ label: moduleConfig.title });
  }

  return breadcrumbs;
}

// Utility functions for easy route management
export const getRouteConfig = (key: string) => {
  return ROUTE_CONFIG[key as keyof typeof ROUTE_CONFIG];
};

export const getAllRoutes = () => {
  return Object.keys(ROUTE_CONFIG);
};

export const getRoutesBySection = (section: string) => {
  return Object.entries(ROUTE_CONFIG)
    .filter(([_, config]) => config.section === section)
    .map(([key, _]) => key);
};

// Section utility functions
export const getAllSections = () => {
  return Object.keys(NAVIGATION_CONFIG.sections);
};

export const getSectionTitle = (sectionKey: string) => {
  return NAVIGATION_CONFIG.sections[sectionKey as keyof typeof NAVIGATION_CONFIG.sections]?.title || sectionKey;
};

export const getSectionOrder = (sectionKey: string) => {
  return NAVIGATION_CONFIG.sections[sectionKey as keyof typeof NAVIGATION_CONFIG.sections]?.order || 999;
}; 