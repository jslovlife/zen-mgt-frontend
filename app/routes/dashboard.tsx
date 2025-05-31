import { useState } from "react";
import { Outlet, useLocation } from "@remix-run/react";
import { Button, Breadcrumb, SideNavbar } from "~/components";
import type { BreadcrumbItem } from "~/components";
import { getNavigationConfig, getBreadcrumbConfig } from "~/config/routes";

export default function DashboardLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Determine active module from current path
  const getActiveModuleFromPath = () => {
    const path = location.pathname;
    
    // Site
    if (path.includes('/site-management')) return 'site-management';
    
    // Payment
    if (path.includes('/payment-order')) return 'payment-order';
    if (path.includes('/withdraw-order')) return 'withdraw-order';
    
    // Platform Channel
    if (path.includes('/payment-platform')) return 'payment-platform';
    if (path.includes('/withdraw-platform')) return 'withdraw-platform';
    
    // Config
    if (path.includes('/payment-category')) return 'payment-category';
    if (path.includes('/bank-list')) return 'bank-list';
    if (path.includes('/customize-bank-list')) return 'customize-bank-list';
    
    // API Template
    if (path.includes('/template-management')) return 'template-management';
    
    // Tools
    if (path.includes('/api-test')) return 'api-test';
    if (path.includes('/reports')) return 'reports';
    
    // System
    if (path.includes('/user-management')) return 'user-management';
    if (path.includes('/user-group-management')) return 'user-group-management';
    if (path.includes('/role-management')) return 'role-management';
    if (path.includes('/audit-trail')) return 'audit-trail';
    
    return 'site-management'; // default
  };

  const activeModule = getActiveModuleFromPath();

  // Get navigation configuration from routes
  const navigationSections = getNavigationConfig(activeModule);

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const configBreadcrumbs = getBreadcrumbConfig(activeModule);
    return configBreadcrumbs.map(item => ({
      name: item.label,
      href: item.href,
      current: !item.href
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('tempToken');
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-container">
      {/* SideNavbar Component */}
      <SideNavbar
        title="Zen Management"
        sections={navigationSections}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="main-content">
        {/* Top Navigation */}
        <header className="top-nav">
          <div className="top-nav-left">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mobile-menu-btn lg:hidden"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              }
            />
            
            {/* Breadcrumbs Component */}
            <Breadcrumb items={getBreadcrumbs()} />
          </div>

          <div className="top-nav-right">
            <span className="user-greeting">Welcome back, Admin!</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              }
            >
              Logout
            </Button>
          </div>
        </header>

        {/* Page Content - This will be replaced by child routes */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
} 