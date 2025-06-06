import React, { useState } from 'react';
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Users } from 'lucide-react';
import { useNavigate, useLoaderData } from '@remix-run/react';
import { DataTable, ColumnConfig, ActionButton } from '~/components/ui/DataTable';
import { SearchableDropdown } from '~/components/ui/SearchableDropdown';
import { DateTimeUtil } from '~/utils';
import { PageLayout } from '~/components/layout/PageLayout';
import { User } from '~/types/user.type';
import { Alert } from '~/components';
import { UserService } from "~/services";
import { requireAuth } from "~/config/session.server";
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
}

// Loader function to fetch users data and protect the route
export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== USER MANAGEMENT LOADER START ===");
  
  // Use the centralized authentication utility
  const session = requireAuth(request);
  
  console.log("User management auth token found:", session.authToken?.substring(0, 20) + "...");
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
    if (session.authToken) {
      userService.setServerAuthToken(session.authToken);
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
  } catch (error) {
    console.error("Error fetching users:", error);
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
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { users, pagination, searchCriteria, sortBy, sortDir, error } = useLoaderData<LoaderData>();
  
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
  const [currentFormValues, setCurrentFormValues] = useState<Record<string, string>>(() => {
    // Initialize with current search criteria
    return {
      username: searchCriteria.username || '',
      userCode: searchCriteria.userCode || '',
      email: searchCriteria.email || '',
      recordStatus: searchCriteria.recordStatus || '',
      createdDateFrom: searchCriteria.createdDateFrom || '',
      createdDateTo: searchCriteria.createdDateTo || '',
      lastLoginFrom: searchCriteria.lastLoginFrom || '',
      lastLoginTo: searchCriteria.lastLoginTo || ''
    };
  });
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

  // Update form values when search criteria changes (e.g., from URL)
  React.useEffect(() => {
    setCurrentFormValues({
      username: searchCriteria.username || '',
      userCode: searchCriteria.userCode || '',
      email: searchCriteria.email || '',
      recordStatus: searchCriteria.recordStatus || '',
      createdDateFrom: searchCriteria.createdDateFrom || '',
      createdDateTo: searchCriteria.createdDateTo || '',
      lastLoginFrom: searchCriteria.lastLoginFrom || '',
      lastLoginTo: searchCriteria.lastLoginTo || ''
    });
  }, [searchCriteria]);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setCurrentFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle search from FlexibleSearchFilter component
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
    
    // Set new search parameters
    Object.entries(searchValues).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          url.searchParams.set(key, value.join(','));
        } else if (typeof value === 'object' && value !== null) {
          // Handle date ranges
          if (value.from) url.searchParams.set(`${key}From`, value.from);
          if (value.to) url.searchParams.set(`${key}To`, value.to);
        } else {
          url.searchParams.set(key, value.toString());
        }
      }
    });
    
    url.searchParams.delete('page'); // Reset to first page on search
    navigate(`${url.pathname}${url.search}`, { replace: true });
  };

  // Handle pagination navigation
  const handlePageChange = (newPage: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', newPage.toString());
    navigate(`${url.pathname}${url.search}`, { replace: true });
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('size', newSize.toString());
    url.searchParams.delete('page'); // Reset to first page
    navigate(`${url.pathname}${url.search}`, { replace: true });
  };

  // Handle sorting change
  const handleSortChange = (newSortBy: string, newSortDir: 'asc' | 'desc') => {
    const url = new URL(window.location.href);
    url.searchParams.set('sortBy', newSortBy);
    url.searchParams.set('sortDir', newSortDir);
    url.searchParams.delete('page'); // Reset to first page on sort change
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

  // Column configuration for DataTable
  const columns: ColumnConfig<User>[] = [
    {
      key: 'username',
      title: 'Username',
      dataType: 'string',
      sortable: true,
      filterable: true,
      searchable: true,
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
      searchable: true,
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
      searchable: true,
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
      searchable: true,
      filterOptions: recordStatusHelpers?.getSelectOptions()?.map((option: any) => ({
        value: option.label,
        label: option.label
      })) || [],
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
      searchable: false,
      render: (value: any, record: User) => (
        <div className="flex items-center gap-2">
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

  // Close alert
  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  // Show error if data loading failed
  if (error) {
    return (
      <PageLayout title="User Management" icon={<Users />}>
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium">Error Loading Users</div>
          <div className="text-gray-600 mt-2">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
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

      {/* Direct Search Form - All searchable columns displayed with search button */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            console.log("=== FORM SUBMISSION DEBUG ===");
            console.log("Current form values state:", currentFormValues);
            
            // Use controlled state values instead of FormData to capture SearchableDropdown values
            const searchValues: Record<string, any> = {};
            
            // Include all non-empty values from controlled state
            Object.entries(currentFormValues).forEach(([key, value]) => {
              if (value && value.toString().trim()) {
                searchValues[key] = value.toString().trim();
                console.log(`Including ${key}: ${value}`);
              }
            });
            
            console.log("Final search values to submit:", searchValues);
            handleSearch(searchValues);
          }}
          className="space-y-4"
        >
          {/* Search Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={currentFormValues.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Search by username..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>

            {/* User Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Code
              </label>
              <input
                type="text"
                name="userCode"
                value={currentFormValues.userCode}
                onChange={(e) => handleInputChange('userCode', e.target.value)}
                placeholder="Search by user code..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="text"
                name="email"
                value={currentFormValues.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Search by email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <SearchableDropdown
                options={[
                  { label: 'All Status', value: '' },
                  ...recordStatusHelpers.getSelectOptions()
                ]}
                value={currentFormValues.recordStatus}
                onChange={(value) => handleInputChange('recordStatus', value)}
                placeholder="All Status"
                className="w-full"
              />
            </div>

            {/* Created Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created From
              </label>
              <input
                type="datetime-local"
                name="createdDateFrom"
                value={currentFormValues.createdDateFrom}
                onChange={(e) => handleInputChange('createdDateFrom', e.target.value)}
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>

            {/* Created Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created To
              </label>
              <input
                type="datetime-local"
                name="createdDateTo"
                value={currentFormValues.createdDateTo}
                onChange={(e) => handleInputChange('createdDateTo', e.target.value)}
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>

            {/* Last Login From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Login From
              </label>
              <input
                type="datetime-local"
                name="lastLoginFrom"
                value={currentFormValues.lastLoginFrom}
                onChange={(e) => handleInputChange('lastLoginFrom', e.target.value)}
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>

            {/* Last Login To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Login To
              </label>
              <input
                type="datetime-local"
                name="lastLoginTo"
                value={currentFormValues.lastLoginTo}
                onChange={(e) => handleInputChange('lastLoginTo', e.target.value)}
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>
          </div>

          {/* Active Search Criteria Bubbles */}
          {(() => {
            const hasActiveFilters = Object.keys(currentFormValues).some(key => 
              !['page', 'size', 'sortBy', 'sortDir'].includes(key) && 
              currentFormValues[key] !== null && 
              currentFormValues[key] !== undefined && 
              currentFormValues[key] !== ''
            );
            
            console.log("=== ACTIVE FILTERS DEBUG ===");
            console.log("Search criteria:", currentFormValues);
            console.log("Has active filters:", hasActiveFilters);
            console.log("Filtered criteria:", Object.entries(currentFormValues).filter(([key, value]) => 
              !['page', 'size', 'sortBy', 'sortDir'].includes(key) && value !== null && value !== undefined && value !== ''
            ));
            
            return hasActiveFilters;
          })() && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(currentFormValues).map(([key, value]) => {
                  if (['page', 'size', 'sortBy', 'sortDir'].includes(key) || !value || value === '') {
                    return null;
                  }
                  
                  const getFilterLabel = (key: string, value: any) => {
                    switch (key) {
                      case 'username': return `Username: ${value}`;
                      case 'userCode': return `User Code: ${value}`;
                      case 'email': return `Email: ${value}`;
                      case 'recordStatus': {
                        // Find the label for the status value
                        const statusOptions = recordStatusHelpers?.getSelectOptions() || [];
                        const statusOption = statusOptions.find((option: any) => option.value === value);
                        const statusLabel = statusOption?.label || value;
                        return `Status: ${statusLabel}`;
                      }
                      case 'createdDateFrom': return `Created From: ${new Date(value).toLocaleString()}`;
                      case 'createdDateTo': return `Created To: ${new Date(value).toLocaleString()}`;
                      case 'lastLoginFrom': return `Login From: ${new Date(value).toLocaleString()}`;
                      case 'lastLoginTo': return `Login To: ${new Date(value).toLocaleString()}`;
                      default: return `${key}: ${value}`;
                    }
                  };

                  return (
                    <div
                      key={key}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full border border-purple-200"
                    >
                      <span>{getFilterLabel(key, value)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          // Clear the form field
                          setCurrentFormValues(prev => ({
                            ...prev,
                            [key]: ''
                          }));
                          
                          // Update URL
                          const url = new URL(window.location.href);
                          url.searchParams.delete(key);
                          navigate(`${url.pathname}${url.search}`, { replace: true });
                        }}
                        className="ml-1 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                        title="Remove filter"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
                
                {/* Clear All Filters Button */}
                <button
                  type="button"
                  onClick={() => {
                    // Clear form values state
                    setCurrentFormValues({
                      username: '',
                      userCode: '',
                      email: '',
                      recordStatus: '',
                      createdDateFrom: '',
                      createdDateTo: '',
                      lastLoginFrom: '',
                      lastLoginTo: ''
                    });
                    
                    // Reset the actual form elements
                    const form = document.querySelector('form') as HTMLFormElement;
                    if (form) {
                      form.reset();
                      
                      // Manually clear datetime-local inputs (sometimes form.reset() doesn't work with these)
                      const datetimeInputs = form.querySelectorAll('input[type="datetime-local"]');
                      datetimeInputs.forEach((input: any) => {
                        input.value = '';
                      });
                      
                      // Manually clear text inputs
                      const textInputs = form.querySelectorAll('input[type="text"]');
                      textInputs.forEach((input: any) => {
                        input.value = '';
                      });
                      
                      // Note: SearchableDropdown is controlled via currentFormValues state, so clearing the state is sufficient
                    }
                    
                    // Clear search and navigate to clean URL
                    handleSearch({});
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-300 hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Search Button and Reset */}
          <div className="flex items-center justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-purple-600 border border-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Data Table */}
      <DataTable
        data={transformedUsers}
        columns={columns}
        loading={loading}
        enableFilter={true}
        enableSorter={true}
        enablePagination={false}
        pageSize={pagination.pageSize}
        emptyText="No users found"
      />

      {/* Compact Backend Pagination Controls */}
      <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
        {/* Left: Results info and page size */}
        <div className="flex items-center space-x-6">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{pagination.total}</span> users
            {pagination.total > 0 && (
              <span className="ml-2">
                (page {pagination.page} of {pagination.totalPages})
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Show:</label>
            <select
              value={pagination.pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Center: Sorting controls */}
        <div className="flex items-center space-x-3">
          <label className="text-sm text-gray-600">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value, sortDir)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="userCode">User Code</option>
            <option value="username">Username</option>
            <option value="firstName">First Name</option>
            <option value="lastName">Last Name</option>
            <option value="email">Email</option>
            <option value="createdAt">Created Date</option>
            <option value="lastLoginAt">Last Login</option>
          </select>
          
          <button
            onClick={() => handleSortChange(sortBy, sortDir === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-1 text-sm bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-purple-700"
          >
            {sortDir === 'asc' ? '↑' : '↓'}
          </button>
        </div>
        
        {/* Right: Navigation controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.page <= 1 || loading}
              className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ««
            </button>
            
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ‹
            </button>
            
            <span className="px-4 py-1 text-sm font-medium text-white bg-purple-600 border-t border-b border-purple-600">
              {pagination.page}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ›
            </button>
            
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              »»
            </button>
          </div>
        )}
      </div>

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