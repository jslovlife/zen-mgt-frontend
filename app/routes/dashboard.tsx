import { useState, useEffect, createContext, useContext } from "react";
import { Outlet, useLocation, useNavigate, useLoaderData, useRevalidator } from "@remix-run/react";
import { type LoaderFunctionArgs, redirect, json } from "@remix-run/node";
import { Button, Breadcrumb, SideNavbar } from "~/components";
import type { BreadcrumbItem } from "~/components";
import { getNavigationConfig, getBreadcrumbConfig } from "~/config/routes";
import { AuthService } from "~/services/auth.service";
import { APIUtil } from "~/utils/api.util";
import { EnumService } from "~/services/enum.service";
import type { EnumCollections } from "~/types/enum.type";
import { EnumCacheUtil } from "~/utils/enum-cache.util";
import { getSecureAuthToken } from "~/config/session.server";
import { UserService } from "~/services";
import { authMigration } from "~/utils/auth-migration.util";

interface DashboardLoaderData {
  success: boolean;
  enums: EnumCollections | null;
  error: string | null;
  cached: boolean;
}

// Context for enums
const EnumContext = createContext<EnumCollections | null>(null);

// Loader function to protect dashboard routes and load enums after authentication
export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== DASHBOARD LOADER START ===");
  
  // SECURITY: Use secure session authentication - no tokens in cookies!
  const authToken = await getSecureAuthToken(request);
  
  if (!authToken) {
    console.log("❌ No secure session found, redirecting to login");
    throw redirect("/login");
  }
  
  console.log("✅ Secure session authenticated for dashboard");

  try {
    // Use the auth token for enum service
    const enumService = EnumService.getInstance();
    
    console.log("=== FETCHING ENUMS WITH SECURE TOKEN ===");
    const enums = await enumService.getAllEnums(authToken);
    console.log("Enums loaded:", Object.keys(enums));

    // Try to get user info (optional, for display purposes)
    let currentUser = null;
    try {
      const userService = UserService.getInstance();
      userService.setServerAuthToken(authToken);
      // We would need the current user's ID here - for now, we'll skip this
      userService.clearServerAuthToken();
    } catch (userError) {
      console.warn("Could not fetch current user info:", userError);
    }

    return json({
      enums,
      currentUser,
      success: true
    });
  } catch (error) {
    console.error("Dashboard loader error:", error);
    
    // If enums fail to load due to auth issues, redirect to login
    if (error instanceof Error && (
      error.message.includes('401') || 
      error.message.includes('UNAUTHORIZED') ||
      error.message.includes('unauthorized') ||
      error.message.includes('403')
    )) {
      console.log("Auth error in dashboard, redirecting to login");
      throw redirect("/login");
    }
    
    // Return error state for non-auth issues but don't crash
    return json({
      enums: null,
      currentUser: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { success, enums, error, cached } = useLoaderData<DashboardLoaderData>();
  const revalidator = useRevalidator();

  // SECURITY: Clean up legacy client-side auth on dashboard load
  useEffect(() => {
    console.log("🔒 DASHBOARD: Cleaning up legacy client-side authentication");
    
    // Clean up any legacy auth data but don't redirect - server-side auth is handling protection
    const authStatus = authMigration.getAuthStatus();
    console.log("📊 Auth Status:", authStatus);
    
    if (authStatus.hasLegacyAuth) {
      console.log("⚠️ LEGACY AUTH DETECTED - CLEANING UP");
      authMigration.forceCompleteMigration();
    }
    
    // Note: No client-side redirects - server-side loader handles all authentication
    console.log("✅ Server-side authentication is protecting this route");
  }, []);

  // Debug auth state in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      authMigration.debugAuthState();
    }
  }, []);

  useEffect(() => {
    console.log("=== DASHBOARD COMPONENT MOUNTED ===");
    console.log("Dashboard location:", location.pathname);
    console.log("Loader data:", { success, enums: !!enums, error, cached });
    
    // Cache enums in localStorage for future use
    if (success && enums) {
      EnumCacheUtil.cacheEnums(enums);
    }
    
    return () => {
      console.log("=== DASHBOARD COMPONENT UNMOUNTED ===");
    };
  }, [success, enums, cached]);

  useEffect(() => {
    console.log("=== DASHBOARD LOCATION CHANGED ===");
    console.log("New location:", location.pathname);
    console.log("Current loader data:", { success, enums: !!enums, error, cached });
  }, [location.pathname]);

  // Debug: Log the exact state before any early returns
  console.log("=== DASHBOARD RENDER STATE ===");
  console.log("success:", success);
  console.log("enums exists:", !!enums);
  console.log("error:", error);
  console.log("cached:", cached);
  console.log("enums keys:", enums ? Object.keys(enums) : 'null');

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
    
    // Add immediate user feedback
    if (typeof window !== 'undefined') {
      window.alert("Logging out..."); // Temporary debug feedback
    }
    
    try {
      // Clear client-side tokens first
      const authService = AuthService.getInstance();
      console.log("About to call authService.logout()...");
      await authService.logout();
      console.log("Client-side logout completed");
      
      // Clear the auth cookie immediately on client-side
      document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      console.log("Client-side cookie cleared");
      
      // Navigate to logout route which will handle server-side cleanup
      console.log("About to navigate to /logout...");
      navigate('/logout', { replace: true });
      console.log("Navigate call completed");
      
    } catch (error) {
      console.error('Logout error:', error);
      // Add error feedback
      if (typeof window !== 'undefined') {
        window.alert(`Logout error: ${error}`);
      }
      // Even if logout fails, still clear cookie and navigate to logout route
      document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      navigate('/logout', { replace: true });
    }
  };

  // Show error state if enum loading failed
  if (!success || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium mb-2">
              Error Loading Application Data
            </div>
            <div className="text-gray-600 mb-4">
              {error || 'Failed to load required application data'}
            </div>
            <button 
              onClick={() => revalidator.revalidate()}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state if enums are not available
  if (!enums) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading application data...</div>
        </div>
      </div>
    );
  }

  return (
    <EnumContext.Provider value={enums}>
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
              
              {/* Test button to debug onClick issue */}
              <button
                onClick={() => {
                  console.log("TEST BUTTON CLICKED!");
                  alert("Test button works!");
                }}
                style={{
                  padding: '8px 16px',
                  marginRight: '8px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔓 Test
              </button>
              
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
    </EnumContext.Provider>
  );
}

/**
 * Custom hook to access enums from context
 * Must be used within dashboard layout
 */
export function useEnums(): EnumCollections {
  const enums = useContext(EnumContext);
  
  if (!enums) {
    
    // Try localStorage fallback before throwing error
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('zen_mgt_enums');
        if (cached) {
          const cacheData = JSON.parse(cached);
          console.log("Found cached enum data:", cacheData);
          return cacheData.data;
        }
      } catch (cacheError) {
        console.error("Failed to read from localStorage:", cacheError);
      }
    }
    
    console.error("This component must be rendered within the dashboard layout");
    throw new Error('useEnums must be used within dashboard layout with loaded enum data');
  }
  
  return enums;
} 