import React, { useState, useEffect } from 'react';
import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Users } from 'lucide-react';
import { useNavigate, useLoaderData } from '@remix-run/react';
import { DataTable, ColumnConfig, ActionButton, SearchFilterV2 } from '~/components/ui';
import type { SearchFieldConfig } from '~/components/ui';
import { DateTimeUtil } from '~/utils';
import { PageLayout } from '~/components/layout/PageLayout';
import { User } from '~/types/user.type';
import { Alert } from '~/components';
import { UserService } from "~/services";
import { getSecureAuthToken } from "~/config/session.server";
import { UserSearchCriteria, SearchUtils, USER_SEARCH_CONFIG } from "~/types/search.type";
import { useEnums } from "~/routes/dashboard";
import { useRecordStatusHelpers } from "~/hooks/useEnums";

interface LoaderData {
  users: User[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    pageSize: number;
  };
  searchCriteria: Record<string, any>;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  error?: string;
  sessionExpired?: boolean;
}

// Loader function to fetch users data and protect the route
export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== USER MANAGEMENT LOADER START ===");
  
  try {
    // Use secure session authentication
    const authToken = await getSecureAuthToken(request);
    
    if (!authToken) {
      console.log("❌ No secure session found, redirecting to login");
      throw redirect("/login");
    }
    
    console.log("User management auth token found:", authToken.substring(0, 20) + "...");
    console.log("User management authentication passed, proceeding to fetch data");

    // Extract search criteria using the enhanced search architecture
    const url = new URL(request.url);
    const searchCriteria = SearchUtils.URLParamsToCriteria(url.searchParams, USER_SEARCH_CONFIG);
    
    // Set defaults
    const page = searchCriteria.page || 1;
    const size = searchCriteria.size || USER_SEARCH_CONFIG.defaultPageSize;
    const sortBy = searchCriteria.sortBy || USER_SEARCH_CONFIG.defaultSortBy;
    const sortDir = searchCriteria.sortDir || USER_SEARCH_CONFIG.defaultSortDir;
    
    console.log("Extracted search criteria with named parameter mapping:", searchCriteria);
    console.log("Pagination params:", { page, size, sortBy, sortDir });

    try {
      // Fetch users from UserService with enhanced search capabilities
      const userService = UserService.getInstance();
      
      // Inject the server-side auth token for this request
      if (authToken) {
        userService.setServerAuthToken(authToken);
      }
      
      let result;
      
      // Check if we have any search criteria beyond basic pagination
      const hasSearchCriteria = Object.keys(searchCriteria).some(key => 
        !['page', 'size', 'sortBy', 'sortDir'].includes(key) && 
        searchCriteria[key] !== null && 
        searchCriteria[key] !== undefined && 
        searchCriteria[key] !== ''
      );
      
      if (hasSearchCriteria) {
        // Use flexible search with named parameter implementation
        console.log("Using flexible search with named parameters");
        const flexibleSearchCriteria: UserSearchCriteria = {
          page,
          size,
          sortBy,
          sortDir,
          ...searchCriteria
        };
        
        const flexibleResult = await userService.searchUsersFlexible(flexibleSearchCriteria);
        
        if (flexibleResult.success && flexibleResult.data) {
          // Transform SearchResponse<User> to match the expected format
          result = {
            success: true,
            data: {
              users: flexibleResult.data.content || [],
              total: flexibleResult.data.totalElements || 0,
              page: flexibleResult.data.page || page,
              totalPages: flexibleResult.data.totalPages || 0,
              pageSize: flexibleResult.data.size || size
            }
          };
        } else {
          result = {
            success: false,
            error: flexibleResult.error || "Search failed"
          };
        }
      } else {
        // Use regular pagination endpoint for basic listing
        console.log("Using basic pagination endpoint");
        result = await userService.getUsers(page, size, sortBy, sortDir);
      }

      console.log("Final API result:", result);
      
      // Clear the server-side token after use
      userService.clearServerAuthToken();
      
      if (result.success && result.data) {
        console.log("result.data structure:", {
          hasUsers: !!result.data.users,
          usersLength: result.data.users?.length,
          total: result.data.total,
          page: result.data.page,
          totalPages: result.data.totalPages,
          pageSize: result.data.pageSize
        });

        // Validate the data structure
        if (!Array.isArray(result.data.users)) {
          console.error("Users data is not an array:", result.data.users);
          throw new Error("Invalid users data format");
        }

        return json({ 
          users: result.data.users,
          pagination: {
            total: result.data.total || 0,
            page: result.data.page || 1,
            totalPages: result.data.totalPages || 0,
            pageSize: result.data.pageSize || size
          },
          searchCriteria: searchCriteria,
          sortBy: sortBy,
          sortDir: sortDir
        });
      } else {
        // Check if the error indicates session expiration or unauthorized access
        const errorMessage = result.error || "Failed to fetch users data";
        const isUnauthorized = errorMessage.toLowerCase().includes('unauthorized') || 
                              errorMessage.toLowerCase().includes('403') || 
                              errorMessage.toLowerCase().includes('401');
        
        if (isUnauthorized) {
          console.error("Session expired or unauthorized access detected");
          return json({ 
            users: [], 
            pagination: {
              total: 0,
              page: 1,
              totalPages: 0,
              pageSize: size
            },
            searchCriteria: searchCriteria,
            sortBy: sortBy,
            sortDir: sortDir,
            sessionExpired: true,
            error: "Session has expired"
          }, { status: 401 });
        }
        
        console.error("Failed to fetch users:", result.error);
        return json({ 
          users: [], 
          pagination: {
            total: 0,
            page: 1,
            totalPages: 0,
            pageSize: size
          },
          searchCriteria: searchCriteria,
          sortBy: sortBy,
          sortDir: sortDir,
          error: result.error || "Failed to fetch users data" 
        }, { status: 500 });
      }
    } catch (apiError) {
      console.error("API Error fetching users:", apiError);
      
      // Check if it's an authentication error
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
      const isUnauthorized = errorMessage.toLowerCase().includes('unauthorized') || 
                            errorMessage.toLowerCase().includes('403') || 
                            errorMessage.toLowerCase().includes('401');
      
      if (isUnauthorized) {
        console.error("Session expired during API call");
        return json({ 
          users: [], 
          pagination: {
            total: 0,
            page: 1,
            totalPages: 0,
            pageSize: size
          },
          searchCriteria: searchCriteria,
          sortBy: sortBy,
          sortDir: sortDir,
          sessionExpired: true,
          error: "Session has expired"
        }, { status: 401 });
      }
      
      return json({ 
        users: [], 
        pagination: {
          total: 0,
          page: 1,
          totalPages: 0,
          pageSize: size
        },
        searchCriteria: searchCriteria,
        sortBy: sortBy,
        sortDir: sortDir,
        error: "Failed to fetch users data" 
      }, { status: 500 });
    }
  } catch (authError) {
    console.error("Authentication error in loader:", authError);
    // This will redirect to login
    throw redirect("/login");
  }
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { users, pagination, searchCriteria, sortBy, sortDir, error, sessionExpired } = useLoaderData<LoaderData>();
  
  // Debug pagination data
  console.log("=== USER MANAGEMENT COMPONENT PAGINATION DEBUG ===");
  console.log("Received pagination data:", pagination);
  console.log("Current page:", pagination.page);
  console.log("Total pages:", pagination.totalPages);
  console.log("Page size:", pagination.pageSize);
  console.log("Total items:", pagination.total);
  console.log("Users count:", users.length);
  
  // Get enums from dashboard context with error handling
  let recordStatuses: any[] = [];
  let recordStatusHelpers: any = null;
  
  console.log("=== USER MANAGEMENT ENUM LOADING START ===");
  
  try {
    console.log("Attempting to load enums from dashboard context...");
    const enumsFromContext = useEnums();
    console.log("Successfully got enums from context:", enumsFromContext);
    console.log("Record statuses available:", enumsFromContext.recordStatuses);
    
    const { recordStatuses: enumRecordStatuses } = enumsFromContext;
    recordStatuses = enumRecordStatuses;
    recordStatusHelpers = useRecordStatusHelpers(recordStatuses);
    
    console.log("=== ENUM LOADING SUCCESS ===");
    console.log("Record statuses count:", recordStatuses?.length);
    console.log("Status options:", recordStatusHelpers?.getSelectOptions());
  } catch (enumError: any) {
    console.error("=== ENUM CONTEXT ERROR ===");
    console.error("Failed to access enum context:", enumError);
    console.error("Error details:", enumError.message);
    console.error("User management route might not be properly nested under dashboard");
    
    // Fallback: Create basic helpers
    console.log("Using fallback hardcoded enum helpers");
    recordStatusHelpers = {
      getSelectOptions: () => {
        console.log("FALLBACK: Using hardcoded select options");
        return [
          { label: 'Active', value: '1' },
          { label: 'Inactive', value: '2' }
        ];
      },
      getDisplayByCode: (code: number) => {
        console.log("FALLBACK: Using hardcoded display for code:", code);
        return code === 1 ? 'Active' : 'Inactive';
      },
      getStatusBadgeClasses: (code: number) => {
        console.log("FALLBACK: Using hardcoded badge classes for code:", code);
        return code === 1 
          ? 'px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'
          : 'px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800';
      }
    };
  }
  
  // State
  const [loading, setLoading] = useState(false);
  const [pendingPageSize, setPendingPageSize] = useState<number | null>(null);
  const [pendingSortBy, setPendingSortBy] = useState<string | null>(null);
  const [pendingSortDir, setPendingSortDir] = useState<'asc' | 'desc' | null>(null);
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  // Clear pending states when loader data changes
  useEffect(() => {
    console.log('🔧 useEffect clearing pending states triggered by:', {
      newPageSize: pagination.pageSize,
      newSortBy: sortBy,
      newSortDir: sortDir,
      currentPendingPageSize: pendingPageSize,
      currentPendingSortBy: pendingSortBy,
      currentPendingSortDir: pendingSortDir
    });
    
    // Only clear pending page size if it matches the new loaded value
    if (pendingPageSize !== null && pendingPageSize === pagination.pageSize) {
      console.log('🔧 Clearing pendingPageSize because it matches loaded value');
      setPendingPageSize(null);
    }
    
    // Only clear pending sort if it matches the new loaded values
    if (pendingSortBy !== null && pendingSortBy === sortBy) {
      console.log('🔧 Clearing pendingSortBy because it matches loaded value');
      setPendingSortBy(null);
    }
    
    if (pendingSortDir !== null && pendingSortDir === sortDir) {
      console.log('🔧 Clearing pendingSortDir because it matches loaded value');
      setPendingSortDir(null);
    }
  }, [pagination.pageSize, sortBy, sortDir, pendingPageSize, pendingSortBy, pendingSortDir]);

  // Handle session expiration
  React.useEffect(() => {
    if (sessionExpired) {
      console.log("🔒 Session expired detected, showing alert");
      setAlert({
        isOpen: true,
        type: 'warning',
        title: 'Session Expired',
        message: 'Your session has expired. You will be redirected to the login page.',
        onConfirm: () => {
          console.log("🔒 Redirecting to login due to session expiration");
          navigate('/login', { replace: true });
        }
      });
    }
  }, [sessionExpired, navigate]);

  // Handle search from SearchFilterV2 component
  const handleSearch = async (searchValues: Record<string, any>) => {
    const url = new URL(window.location.href);
    
    // Clear existing search parameters
    USER_SEARCH_CONFIG.searchFields.forEach(field => {
      url.searchParams.delete(field.key);
    });
    
    // Clear standard parameters
    url.searchParams.delete('q');
    url.searchParams.delete('exactMatch');
    url.searchParams.delete('caseSensitive');
    
    // Set new search parameters with field mapping
    Object.entries(searchValues).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Map SearchFilterV2 field names to expected backend field names
        let mappedKey = key;
        
        // Handle timestamp field mapping
        if (key === 'createdDateFrom') mappedKey = 'createdDateFrom';
        if (key === 'createdDateTo') mappedKey = 'createdDateTo';
        if (key === 'lastLoginFrom') mappedKey = 'lastLoginFrom';
        if (key === 'lastLoginTo') mappedKey = 'lastLoginTo';
        
        if (Array.isArray(value)) {
          url.searchParams.set(mappedKey, value.join(','));
        } else {
          url.searchParams.set(mappedKey, value.toString());
        }
      }
    });
    
    url.searchParams.delete('page'); // Reset to first page on search
    navigate(`${url.pathname}${url.search}`, { replace: true });
  };

  // Handle pagination navigation
  const handlePageChange = (newPage: number) => {
    console.log("🔄 Page change requested:", newPage);
    console.log("Current pagination state:", pagination);
    const url = new URL(window.location.href);
    url.searchParams.set('page', newPage.toString());
    console.log("New URL:", `${url.pathname}${url.search}`);
    navigate(`${url.pathname}${url.search}`, { replace: true });
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    console.log("📏 Page size change requested:", newSize);
    console.log("Current pagination state:", pagination);
    console.log("Setting pendingPageSize to:", newSize);
    setPendingPageSize(newSize); // Set pending state immediately
    const url = new URL(window.location.href);
    url.searchParams.set('size', newSize.toString());
    url.searchParams.delete('page'); // Reset to first page
    console.log("New URL:", `${url.pathname}${url.search}`);
    navigate(`${url.pathname}${url.search}`, { replace: true });
  };

  // Handle sorting change
  const handleSortChange = (newSortBy: string, newSortDir: 'asc' | 'desc') => {
    console.log("🔄 Sort change requested:", { newSortBy, newSortDir });
    console.log("Current sort state:", { sortBy, sortDir });
    console.log("Setting pending sort to:", { newSortBy, newSortDir });
    setPendingSortBy(newSortBy); // Set pending state immediately
    setPendingSortDir(newSortDir);
    const url = new URL(window.location.href);
    url.searchParams.set('sortBy', newSortBy);
    url.searchParams.set('sortDir', newSortDir);
    url.searchParams.delete('page'); // Reset to first page on sort change
    console.log("New URL:", `${url.pathname}${url.search}`);
    navigate(`${url.pathname}${url.search}`, { replace: true });
  };

  // Helper function to format session validity
  const formatSessionValidity = (validityMs: number): string => {
    const hours = validityMs / (1000 * 60 * 60);
    if (hours < 1) {
      const minutes = validityMs / (1000 * 60);
      return `${minutes.toFixed(0)}m`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    } else {
      const days = hours / 24;
      return `${days.toFixed(1)}d`;
    }
  };

  // Transform users data to include computed display values for filtering and sorting
  const transformedUsers = users.map(user => ({
    ...user,
    recordStatusDisplay: recordStatusHelpers?.getDisplayByCode(user.recordStatus) || user.recordStatus?.toString() || 'Unknown'
  }));

  // Configure search fields for SearchFilterV2
  const searchFields: SearchFieldConfig[] = [
    {
      key: 'username',
      label: 'Username',
      type: 'text',
      placeholder: 'Search by username...'
    },
    {
      key: 'userCode',
      label: 'User Code',
      type: 'text',
      placeholder: 'Search by user code...'
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      placeholder: 'Search by email...'
    },
    {
      key: 'recordStatus',
      label: 'Status',
      type: 'dropdown',
      options: recordStatusHelpers?.getSelectOptions() || [
        { label: 'Active', value: '1' },
        { label: 'Inactive', value: '2' }
      ]
    },
    {
      key: 'createdDate',
      label: 'Created',
      type: 'timestamp',
      gridCols: 2
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      type: 'timestamp',
      gridCols: 2
    }
  ];

  // Prepare initial values for SearchFilterV2
  const searchInitialValues = {
    username: searchCriteria.username || '',
    userCode: searchCriteria.userCode || '',
    email: searchCriteria.email || '',
    recordStatus: searchCriteria.recordStatus || '',
    createdDateFrom: searchCriteria.createdDateFrom || '',
    createdDateTo: searchCriteria.createdDateTo || '',
    lastLoginFrom: searchCriteria.lastLoginFrom || '',
    lastLoginTo: searchCriteria.lastLoginTo || ''
  };

  // Column configuration for DataTable
  const columns: ColumnConfig<User>[] = [
    {
      key: 'username',
      title: 'Username',
      dataType: 'string',
      sortable: true,
      filterable: true,
      render: (value: string, record: User) => (
        <div className="font-medium text-gray-900">{value}</div>
      )
    },
    {
      key: 'userCode',
      title: 'User Code',
      dataType: 'string',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <div className="text-gray-600 font-mono text-sm">{value}</div>
      )
    },
    {
      key: 'email',
      title: 'Email',
      dataType: 'string',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <div className="text-gray-600">{value}</div>
      )
    },
    {
      key: 'recordStatusDisplay' as keyof User,
      title: 'Status',
      dataType: 'string',
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' }
      ],
      render: (value: string, record: any) => {
        const originalValue = record.recordStatus;
        const displayText = recordStatusHelpers.getDisplayByCode(originalValue);
        const badgeClasses = recordStatusHelpers.getStatusBadgeClasses(originalValue);
        
        return <span className={badgeClasses}>{displayText}</span>;
      }
    },
    {
      key: 'sessionValidity',
      title: 'Session Validity',
      dataType: 'number',
      sortable: true,
      filterable: true,
      render: (value: number) => (
        <div className="text-gray-600">{formatSessionValidity(value)}</div>
      )
    },
    {
      key: 'lastLoginAt',
      title: 'Last Login',
      dataType: 'timestamp',
      sortable: true,
      filterable: true,
      render: (value: string | null) => (
        <div className="text-gray-600">
          {value ? DateTimeUtil.forTableDateTime(value) : 'Never'}
        </div>
      )
    },
    {
      key: 'createdAt',
      title: 'Created',
      dataType: 'timestamp',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <div className="text-gray-600">
          {DateTimeUtil.forTableDateTime(value)}
        </div>
      )
    },
    {
      key: 'actions' as keyof User,
      title: 'Actions',
      dataType: 'string',
      sortable: false,
      filterable: false,
      render: (value: any, record: User) => (
        <div className="flex items-center gap-2">
          {/* Status Toggle Section */}
          <div className="flex items-center gap-1">
            <span className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${Number(record.recordStatus) === 1 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
              }
            `}>
              {Number(record.recordStatus) === 1 ? 'Active' : 'Inactive'}
            </span>
            <button
              onClick={() => handleToggleStatus(record.hashedUserId, record.username, Number(record.recordStatus || 0))}
              disabled={loading}
              className={`
                px-2 py-1 text-xs font-medium rounded border transition-colors
                ${Number(record.recordStatus) === 1
                  ? 'text-red-600 border-red-300 hover:bg-red-50'
                  : 'text-green-600 border-green-300 hover:bg-green-50'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              title={`Click to ${Number(record.recordStatus) === 1 ? 'deactivate' : 'activate'} user`}
            >
              {Number(record.recordStatus) === 1 ? 'Deactivate' : 'Activate'}
            </button>
          </div>
          
          <ActionButton
            variant="primary"
            onClick={() => handleViewUser(record.hashedUserId)}
          >
            View
          </ActionButton>
          <ActionButton
            variant="error"
            onClick={() => handleDeleteUser(record.hashedUserId, record.username)}
          >
            Delete
          </ActionButton>
        </div>
      )
    }
  ];

  // Handle add user
  const handleAddUser = () => {
    navigate('/dashboard/user-administration/user-management/insert');
  };

  // Handle view user
  const handleViewUser = (hashedUserId: string) => {
    // URL-encode the hashed user ID to handle special characters like / + =
    const encodedUserId = encodeURIComponent(hashedUserId);
    console.log("Original hashed user ID:", hashedUserId);
    console.log("URL-encoded hashed user ID:", encodedUserId);
    // Navigate to edit page for viewing/editing
    navigate(`/dashboard/user-administration/user-management/edit/${encodedUserId}`);
  };

  // Handle delete user
  const handleDeleteUser = (hashedUserId: string, username: string) => {
    setAlert({
      isOpen: true,
      type: 'confirm',
      title: 'Confirm Delete',
      message: `Are you sure you want to delete user "${username}"? This action will soft-delete the user (set status to DELETED).`,
      onConfirm: () => confirmDeleteUser(hashedUserId)
    });
  };

  // Confirm delete user
  const confirmDeleteUser = async (hashedUserId: string) => {
    setLoading(true);
    try {
      const userService = UserService.getInstance();
      const result = await userService.deleteUser(hashedUserId);
      
      if (result.success) {
        // With backend pagination, we need to reload the page to reflect changes
        window.location.reload();
        
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'User Deleted',
          message: 'User has been successfully deleted.'
        });
      } else {
        throw new Error(result.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Delete Error',
        message: 'Failed to delete user. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle user status
  const handleToggleStatus = async (hashedUserId: string, username: string, currentStatus: number) => {
    setLoading(true);
    try {
      const userService = UserService.getInstance();
      
      // Make sure to use server-side auth if available (for consistency with other API calls)
      // Note: This might be needed to prevent auth issues
      
      const result = await userService.toggleUserStatus(hashedUserId);
      
      if (result.success && result.data) {
        // Show success message immediately, then reload
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'Status Updated',
          message: `User "${username}" status has been changed to ${result.data.newStatus}.`
        });
        
        // Reload the page after a short delay to show the success message
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(result.error || 'Failed to toggle user status');
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      
      // Don't redirect to logout on toggle failure - stay on page and show error
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Status Toggle Error',
        message: `Failed to toggle user status for "${username}". Please check your connection and try again.`
      });
    } finally {
      setLoading(false);
    }
  };

  // Close alert
  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  // Debug externalPagination values before rendering
  const externalPaginationValues = {
    total: pagination.total,
    page: pagination.page,
    totalPages: pagination.totalPages,
    pageSize: pendingPageSize ?? pagination.pageSize,
    sortBy: pendingSortBy ?? sortBy,
    sortDir: pendingSortDir ?? sortDir,
  };
  
  console.log('🔧 UserManagement externalPagination values:', {
    originalPageSize: pagination.pageSize,
    pendingPageSize,
    finalPageSize: externalPaginationValues.pageSize,
    originalSortBy: sortBy,
    pendingSortBy,
    finalSortBy: externalPaginationValues.sortBy,
    originalSortDir: sortDir,
    pendingSortDir,
    finalSortDir: externalPaginationValues.sortDir
  });

  // Show error if data loading failed
  if (error && !sessionExpired) {
    // For debugging pagination, create mock data when there's an auth error
    const mockUsers = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      hashedUserId: `mock-${i}`,
      username: `user${i + 1}`,
      userCode: `USR${String(i + 1).padStart(3, '0')}`,
      email: `user${i + 1}@example.com`,
      recordStatus: i % 2 === 0 ? '1' : '2',
      sessionValidity: 3600000,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ACTIVE'
    })) as User[];

    const mockPagination = {
      total: 25,
      page: 1,
      totalPages: 3,
      pageSize: 10
    };

    console.log("🧪 Using mock data for pagination testing due to auth error");

    return (
      <PageLayout title="User Management (Mock Data)" icon={<Users />}>
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg">
          <div className="text-red-800 font-medium">Authentication Error - Using Mock Data</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>

        {/* Mock Data Table with Integrated Pagination */}
        <DataTable
          data={mockUsers.slice(0, 10)} // Show first 10 for page 1
          columns={columns}
          loading={false}
          enableFilter={true}
          enableSorter={true}
          enablePagination={false}
          pageSize={mockPagination.pageSize}
          emptyText="No users found"
          externalPagination={{
            total: mockPagination.total,
            page: mockPagination.page,
            totalPages: mockPagination.totalPages,
            pageSize: mockPagination.pageSize,
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange,
            sortBy: sortBy,
            sortDir: sortDir,
            onSortChange: handleSortChange
          }}
        />

        {/* Alert Modal */}
        <Alert
          isOpen={alert.isOpen}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={closeAlert}
          onConfirm={alert.onConfirm}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="User Management"
      icon={<Users />}
      addButtonText="Add New User"
      onAddClick={handleAddUser}
    >

      {/* SearchFilterV2 Component */}
      <SearchFilterV2
        fields={searchFields}
        onSearch={handleSearch}
        initialValues={searchInitialValues}
        loading={loading}
        title="Search Users"
      />

      {/* Data Table with Integrated Pagination */}
      <DataTable
        data={transformedUsers}
        columns={columns}
        loading={loading}
        enableFilter={true}
        enableSorter={true}
        enablePagination={false}
        pageSize={pagination.pageSize}
        emptyText="No users found"
        externalPagination={{
          total: externalPaginationValues.total,
          page: externalPaginationValues.page,
          totalPages: externalPaginationValues.totalPages,
          pageSize: externalPaginationValues.pageSize,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
          sortBy: externalPaginationValues.sortBy,
          sortDir: externalPaginationValues.sortDir,
          onSortChange: handleSortChange
        }}
      />

      {/* Alert Modal */}
      <Alert
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={closeAlert}
        onConfirm={alert.onConfirm}
      />
    </PageLayout>
  );
};

export default UserManagement; 