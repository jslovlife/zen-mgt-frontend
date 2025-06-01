import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "@remix-run/react";
import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Button, Breadcrumb, SideNavbar } from "~/components";
import type { BreadcrumbItem } from "~/components";
import { getNavigationConfig, getBreadcrumbConfig } from "~/config/routes";
import { AuthService } from "~/services/auth.service";
import { APIUtil } from "~/utils/api.util";
import { requireAuth } from "~/config/session.server";

// Loader function to protect dashboard routes
export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== DASHBOARD LOADER START ===");
  
  // Use the centralized authentication utility
  const session = requireAuth(request);
  
  console.log("Auth token found in cookies:", session.authToken?.substring(0, 20) + "...");
  console.log("Authentication passed, allowing dashboard access");
  
  return null;
}

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    console.log("=== DASHBOARD COMPONENT MOUNTED ===");
    console.log("Dashboard location:", location.pathname);
    
    return () => {
      console.log("=== DASHBOARD COMPONENT UNMOUNTED ===");
    };
  }, []);

  useEffect(() => {
    console.log("=== DASHBOARD LOCATION CHANGED ===");
    console.log("New location:", location.pathname);
  }, [location.pathname]);

  // Determine active module from current path
  const getActiveModuleFromPath = () => {
    const path = location.pathname;
    
    // Map paths to modules based on the routes configuration
    // Handle both flat routes (dashboard.site-management) and nested routes (dashboard.site.site-management)
    if (path.includes('/site/site-management') || path.includes('/site-management')) return 'site-management';
    if (path.includes('/site/site-pay-platform') || path.includes('/site-pay-platform')) return 'site-pay-platform';
    if (path.includes('/site/site-withdraw-platform') || path.includes('/site-withdraw-platform')) return 'site-withdraw-platform';
    
    if (path.includes('/platform/payment-platform') || path.includes('/payment-platform')) return 'payment-platform';
    if (path.includes('/platform/withdraw-platform') || path.includes('/withdraw-platform')) return 'withdraw-platform';
    
    if (path.includes('/orders/payment-order') || path.includes('/payment-order')) return 'payment-order';
    if (path.includes('/orders/withdraw-order') || path.includes('/withdraw-order')) return 'withdraw-order';
    
    if (path.includes('/configuration/payment-type') || path.includes('/payment-type')) return 'payment-type';
    if (path.includes('/configuration/currency-list') || path.includes('/currency-list')) return 'currency-list';
    if (path.includes('/configuration/bank-list') || path.includes('/bank-list')) return 'bank-list';
    if (path.includes('/configuration/platform-bank-list') || path.includes('/platform-bank-list')) return 'platform-bank-list';
    
    if (path.includes('/tools/reports') || path.includes('/reports')) return 'reports';
    
    if (path.includes('/user-administration/user-management') || path.includes('/user-management')) return 'user-management';
    if (path.includes('/user-administration/user-group-management') || path.includes('/user-group-management')) return 'user-group-management';
    if (path.includes('/user-administration/menu-management') || path.includes('/menu-management')) return 'resource-management';
    
    if (path.includes('/system-administration/system-schedule-job') || path.includes('/system-schedule-job')) return 'system-schedule-job';
    if (path.includes('/settings') || path.includes('/system-parameter')) return 'system-parameter';
    
    // Additional routes that exist in file listing
    if (path.includes('/api-test')) return 'api-test';
    if (path.includes('/audit-trail')) return 'audit-trail';
    if (path.includes('/payment-category')) return 'payment-category';
    if (path.includes('/customize-bank-list')) return 'customize-bank-list';
    if (path.includes('/template-management')) return 'template-management';
    if (path.includes('/role-management')) return 'role-management';
    
    // Default dashboard if on main dashboard route
    if (path === '/dashboard' || path === '/dashboard/') return 'dashboard';
    
    return 'site-management'; // default fallback
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

  // Determine if we should show back button (global - show on all pages except main dashboard)
  const shouldShowBackButton = () => {
    const path = location.pathname;
    // Hide back button only on main dashboard page
    return path !== '/dashboard' && path !== '/dashboard/';
  };

  // Get back navigation path (smart navigation based on current path)
  const getBackPath = () => {
    const path = location.pathname;
    
    // For sub-pages, go back to the main module page
    if (path.includes('/insert') || path.includes('/edit') || path.includes('/view') || path.includes('/detail')) {
      if (path.includes('/site/site-management')) {
        return '/dashboard/site/site-management';
      }
      if (path.includes('/site/site-pay-platform')) {
        return '/dashboard/site/site-pay-platform';
      }
      if (path.includes('/site/site-withdraw-platform')) {
        return '/dashboard/site/site-withdraw-platform';
      }
      if (path.includes('/platform/payment-platform')) {
        return '/dashboard/platform/payment-platform';
      }
      if (path.includes('/platform/withdraw-platform')) {
        return '/dashboard/platform/withdraw-platform';
      }
      if (path.includes('/orders/payment-order')) {
        return '/dashboard/orders/payment-order';
      }
      if (path.includes('/orders/withdraw-order')) {
        return '/dashboard/orders/withdraw-order';
      }
      // Add more module back paths as needed
    }
    
    // For main module pages, go back to dashboard
    return '/dashboard';
  };

  const handleLogout = async () => {
    console.log("=== CLIENT LOGOUT INITIATED ===");
    
    try {
      // Clear client-side tokens first
      const authService = AuthService.getInstance();
      await authService.logout();
      console.log("Client-side logout completed");
      
      // Clear the auth cookie immediately on client-side
      document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      console.log("Client-side cookie cleared");
      
      // Navigate to logout route which will handle server-side cleanup
      navigate('/logout', { replace: true });
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, still clear cookie and navigate to logout route
      document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      navigate('/logout', { replace: true });
    }
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
            <Breadcrumb 
              items={getBreadcrumbs()} 
              showBackButton={shouldShowBackButton()}
              backTo={getBackPath()}
            />
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