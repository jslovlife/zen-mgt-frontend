import { useState, useEffect, createContext, useContext } from "react";
import { Outlet, useLocation, useNavigate, useLoaderData, useRevalidator } from "@remix-run/react";
import { type LoaderFunctionArgs, redirect, json } from "@remix-run/node";
import { Button, Breadcrumb, SideNavbar } from "~/components";
import type { BreadcrumbItem } from "~/components";
import { getNavigationConfig, getBreadcrumbConfig } from "~/config/routes";
import { AuthService } from "~/services/auth.service";
import { APIUtil } from "~/utils/api.util";
import { requireAuth } from "~/config/session.server";
import { EnumService } from "~/services/enum.service";
import type { EnumCollections } from "~/types/enum.type";
import { EnumCacheUtil } from "~/utils/enum-cache.util";

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
  
  try {
    // Use the centralized authentication utility
    const session = requireAuth(request);
    
    console.log("Auth token found in cookies:", session.authToken?.substring(0, 20) + "...");
    console.log("Authentication passed, checking for cached enums...");
    
    if (!session.authToken) {
      throw new Error("No authentication token available");
    }

    // Check for cached enums from login redirect
    const url = new URL(request.url);
    const enumCacheParam = url.searchParams.get('enumCache');
    
    if (enumCacheParam) {
      try {
        console.log("=== USING CACHED ENUMS FROM LOGIN ===");
        const enumData = JSON.parse(decodeURIComponent(enumCacheParam));
        console.log("Cached enum data timestamp:", new Date(enumData.timestamp).toISOString());
        console.log("Cached enums loaded:", {
          recordStatuses: enumData.data.recordStatuses?.length || 0,
          approvalRequestTypes: enumData.data.approvalRequestTypes?.length || 0,
          approvalStatuses: enumData.data.approvalStatuses?.length || 0,
          sysApprovalRequestStatuses: enumData.data.sysApprovalRequestStatuses?.length || 0,
          referenceTypes: enumData.data.referenceTypes?.length || 0,
        });
        
        // Clean URL by redirecting without the cache parameter
        if (url.search.includes('enumCache')) {
          url.searchParams.delete('enumCache');
          // Don't redirect on first load, just use the data
          console.log("Using cached enums, will clean URL on next navigation");
        }
        
        return json({ 
          success: true, 
          enums: enumData.data,
          error: null,
          cached: true
        } as DashboardLoaderData);
      } catch (parseError) {
        console.error("Failed to parse cached enum data:", parseError);
        // Fall through to API loading
      }
    }

    // Note: On subsequent page loads, we'll rely on client-side localStorage
    // and only load from API if absolutely necessary
    console.log("=== NO CACHED ENUMS - CHECKING IF API CALL IS NEEDED ===");
    console.log("This might be a subsequent navigation - client will check localStorage first");

    // Try to load from API as fallback or if no cache
    console.log("=== LOADING ENUMS FROM API ===");
    const enumService = EnumService.getInstance();
    const enums = await enumService.getAllEnums(session.authToken);
    
    console.log("Enums loaded from API:", {
      recordStatuses: enums.recordStatuses?.length || 0,
      approvalRequestTypes: enums.approvalRequestTypes?.length || 0,
      approvalStatuses: enums.approvalStatuses?.length || 0,
      sysApprovalRequestStatuses: enums.sysApprovalRequestStatuses?.length || 0,
      referenceTypes: enums.referenceTypes?.length || 0,
    });
    
    return json({ 
      success: true, 
      enums,
      error: null,
      cached: false
    } as DashboardLoaderData);
    
  } catch (error) {
    console.error("Error in dashboard loader:", error);
    
    if (error instanceof Response && error.status === 401) {
      // Redirect to login on auth failure
      throw new Response('Unauthorized', { 
        status: 302,
        headers: { Location: '/login' }
      });
    }
    
    // Provide fallback enum data instead of complete failure
    console.log("=== PROVIDING FALLBACK ENUM DATA ===");
    const fallbackEnums = {
      recordStatuses: [
        { code: 1, name: 'ACTIVE', display: 'Active', category: 'recordStatus', sortOrder: 1, isDefault: true, metadata: { color: 'green' }},
        { code: 2, name: 'INACTIVE', display: 'Inactive', category: 'recordStatus', sortOrder: 2, isDefault: false, metadata: { color: 'red' }},
        { code: 3, name: 'PENDING', display: 'Pending', category: 'recordStatus', sortOrder: 3, isDefault: false, metadata: { color: 'yellow' }},
        { code: 4, name: 'SUSPENDED', display: 'Suspended', category: 'recordStatus', sortOrder: 4, isDefault: false, metadata: { color: 'orange' }},
        { code: 5, name: 'DELETED', display: 'Deleted', category: 'recordStatus', sortOrder: 5, isDefault: false, metadata: { color: 'gray' }}
      ],
      approvalRequestTypes: [],
      approvalStatuses: [],
      sysApprovalRequestStatuses: [],
      referenceTypes: []
    };
    
    return json({ 
      success: true,  // Mark as success so the app continues to work
      enums: fallbackEnums,
      error: `Using fallback enum data: ${error instanceof Error ? error.message : 'Failed to load application data'}`,
      cached: false
    } as DashboardLoaderData);
  }
}

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { success, enums, error, cached } = useLoaderData<DashboardLoaderData>();
  const revalidator = useRevalidator();

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
  
  console.log("=== useEnums CALLED ===");
  console.log("Context value:", enums);
  console.log("Context exists:", !!enums);
  console.log("Component location:", typeof window !== 'undefined' ? window.location.pathname : 'server-side');
  
  if (!enums) {
    console.error("=== useEnums ERROR ===");
    console.error("EnumContext is null or undefined");
    console.error("Current location:", typeof window !== 'undefined' ? window.location.pathname : 'server-side');
    console.error("Trying localStorage fallback...");
    
    // Try localStorage fallback before throwing error
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('zen_mgt_enums');
        if (cached) {
          const cacheData = JSON.parse(cached);
          console.log("=== USING LOCALSTORAGE FALLBACK ===");
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