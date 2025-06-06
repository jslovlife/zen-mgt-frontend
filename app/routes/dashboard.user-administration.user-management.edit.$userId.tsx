import React, { useState, useEffect } from 'react';
import { UserPen, Save } from 'lucide-react';
import { useNavigate, useParams, Form as RemixForm } from '@remix-run/react';
import { PageLayout } from '~/components/layout/PageLayout';
import { FormField, ButtonGroup } from '~/components';
import { SearchableDropdown } from '~/components/ui/SearchableDropdown';
import type { ButtonConfig } from '~/components';
import { User, UpdateUserRequest } from '~/types/user.type';
import { type LoaderFunctionArgs, type ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { UserService } from "~/services";
import { requireAuth } from "~/config/session.server";
import { DateTimeUtil } from "~/utils/datetime.util";
import { useEnums } from "~/routes/dashboard";
import { useRecordStatusHelpers } from "~/hooks/useEnums";

interface LoaderData {
  user: User;
  error?: string;
}

interface ActionData {
  errors?: Record<string, string>;
  updateData?: UpdateUserRequest;
  // We don't need to pass the whole user object back from action, 
  // just errors and potentially the submitted data for re-population.
}

// Loader function to fetch user data and protect the route
export async function loader({ request, params }: LoaderFunctionArgs) {
  console.log("=== USER EDIT LOADER START ===");
  
  // Use the centralized authentication utility
  const session = requireAuth(request);
  
  console.log("User edit auth token found:", session.authToken?.substring(0, 20) + "...");
  console.log("User edit authentication passed, proceeding to fetch data");

  const encodedUserId = params.userId; // This is URL-encoded
  if (!encodedUserId) {
    throw new Response("User ID is required", { status: 400 });
  }
  
  // URL-decode the hashed user ID
  const hashedUserId = decodeURIComponent(encodedUserId);
  
  console.log("params:", params);
  console.log("Encoded User ID from params:", encodedUserId);
  console.log("Decoded Hashed User ID:", hashedUserId);

  try {
    // Fetch user from UserService
    const userService = UserService.getInstance();
    
    // Inject the server-side auth token for this request
    if (session.authToken) {
      userService.setServerAuthToken(session.authToken);
    }
    console.log("Session user:", session.user);
    const result = await userService.getUserById(hashedUserId); // Use decoded hashed ID
    
    // Clear the server-side token after use
    userService.clearServerAuthToken();
    
    if (result.success && result.data) {
      return json({ user: result.data });
    } else {
      console.error("Failed to fetch user:", result.error);
      return json({ 
        user: null, 
        error: result.error || "Failed to fetch user data" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return json({ 
      user: null, 
      error: "Failed to fetch user data" 
    }, { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  console.log("=== USER EDIT ACTION START ===");
  
  const session = requireAuth(request);
  console.log("User edit action auth token found:", session.authToken?.substring(0, 20) + "...");
  console.log("Session data:", {
    isAuthenticated: session.isAuthenticated,
    hasToken: !!session.authToken,
    tokenLength: session.authToken?.length,
    user: session.user
  });

  const encodedUserId = params.userId;
  if (!encodedUserId) {
    return json({ errors: { submit: "User ID is required for update." } }, { status: 400 });
  }
  
  // URL-decode the hashed user ID
  const hashedUserIdFromParams = decodeURIComponent(encodedUserId);
  console.log("Encoded User ID from params:", encodedUserId);
  console.log("Decoded Hashed User ID from params:", hashedUserIdFromParams);

  try {
    const formData = await request.formData();
    
    const updateData: UpdateUserRequest = {
      username: formData.get('username')?.toString(),
      email: formData.get('email')?.toString(),
      sessionValidity: parseInt(formData.get('sessionValidity')?.toString() || '86400000'),
      recordStatus: formData.get('recordStatus')?.toString() || undefined,
    };

    console.log("Action received user update data:", updateData);

    const errors: Record<string, string> = {};
    if (updateData.username && !updateData.username.trim()) errors.username = 'Username cannot be empty if provided';
    if (updateData.email && !updateData.email.trim()) errors.email = 'Email cannot be empty if provided';
    // Add other necessary validations

    if (Object.keys(errors).length > 0) {
      console.log("Validation errors:", errors);
      return json({ errors, updateData });
    }

    const userService = UserService.getInstance();
    if (session.authToken) {
      userService.setServerAuthToken(session.authToken);
    }

    const result = await userService.updateUser(hashedUserIdFromParams, updateData);
    userService.clearServerAuthToken();

    if (result.success) {
      console.log("User updated successfully:", result.data);
      return redirect('/dashboard/user-administration/user-management');
    } else {
      console.error("Failed to update user:", result.error);
      let errorMessage = result.error || 'Failed to update user';
      if (result.error?.includes('Unauthorized')) {
        errorMessage = 'Permission denied: Your account may not have permission to update users.';
      } else if (result.error?.includes('400') || result.error?.includes('deserialize')) {
        errorMessage = `Backend API mismatch. Verify backend accepts the field names and data format. Original: ${result.error}`;
      }
      return json({ errors: { submit: errorMessage }, updateData });
    }

  } catch (error) {
    console.error("User update action error:", error);
    return json({ 
      errors: { submit: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` }
    });
  }
}

const UserEdit: React.FC = () => {
  const navigate = useNavigate();
  const { user: initialUser, error: loaderError } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Get enums from dashboard context with error handling
  let recordStatuses: any[] = [];
  let recordStatusHelpers: any = null;
  
  try {
    const enumsFromContext = useEnums();
    const { recordStatuses: enumRecordStatuses } = enumsFromContext;
    recordStatuses = enumRecordStatuses;
    recordStatusHelpers = useRecordStatusHelpers(recordStatuses);
  } catch (enumError: any) {
    console.error("Failed to access enum context:", enumError);
    // Fallback: Create basic helpers
    recordStatusHelpers = {
      getSelectOptions: () => [
        { label: 'Active', value: '1' },
        { label: 'Inactive', value: '2' }
      ],
      getDisplayByCode: (code: number) => code === 1 ? 'Active' : 'Inactive',
      getStatusBadgeClasses: (code: number) => 
        code === 1 
          ? 'px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'
          : 'px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'
    };
  }

  // Initialize form data directly from loader data or action data (if form submission failed)
  const [formData, setFormData] = useState<UpdateUserRequest>(() => {
    if (actionData?.updateData) {
      return actionData.updateData; // Repopulate from failed submission
    }
    return {
      username: initialUser?.username || '',
      email: initialUser?.email || '',
      sessionValidity: initialUser?.sessionValidity || 86400000,
      recordStatus: initialUser?.recordStatus?.toString() || '1',
    };
  });

  // Update form data if initialUser changes (e.g., after loader re-runs)
  useEffect(() => {
    if (initialUser && !actionData?.updateData) { // Only update if not repopulating from a failed submit
      setFormData({
        username: initialUser.username || '',
        email: initialUser.email || '',
        sessionValidity: initialUser.sessionValidity || 86400000,
        recordStatus: initialUser.recordStatus ? initialUser.recordStatus.toString() : '1',
      });
    }
  }, [initialUser, actionData?.updateData]);
  
  const errors = actionData?.errors || {};

  // Handle form input changes
  const handleInputChange = (field: keyof UpdateUserRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle cancel/back
  const handleCancel = () => {
    navigate('/dashboard/user-administration/user-management');
  };

  // Session validity options (in milliseconds)
  const sessionValidityOptions = [
    { value: 3600000, label: '1 hour' },
    { value: 14400000, label: '4 hours' },
    { value: 28800000, label: '8 hours' },
    { value: 86400000, label: '24 hours (default)' },
    { value: 604800000, label: '7 days' }
  ];

  // Show error if data loading failed
  if (loaderError || !initialUser) {
    return (
      <PageLayout title="Edit User" icon={<UserPen />}>
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium">Error Loading User</div>
          <div className="text-gray-600 mt-2">{loaderError || 'User not found'}</div>
          <button 
            onClick={() => navigate('/dashboard/user-administration/user-management')} 
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Back to User Management
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`Edit User: ${initialUser.username}`}
      icon={<UserPen />}
    >
      <div className="max-w-4xl mx-auto">
        {/* User Info Header */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-purple-900">
                Editing: {initialUser.username}
              </h3>
              <p className="text-purple-700 mt-1">
                Status: {recordStatusHelpers.getDisplayByCode(parseInt(initialUser.recordStatus?.toString() || '1'))}
              </p>
            </div>
            <div className="text-right text-sm text-purple-600">
              <div>Created: {DateTimeUtil.forTableDateTime(initialUser.createdAt)}</div>
              <div>Last Updated: {DateTimeUtil.forTableDateTime(initialUser.updatedAt)}</div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <RemixForm method="post">
            {/* Add a hidden field for ID if necessary, or rely on params in action */}
            {/* <input type="hidden" name="hashedUserId" value={initialUser.hashedUserId} /> */}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <FormField
                label="Username"
                name="username"
                type="text"
                value={formData.username || ''}
                onChange={(value) => handleInputChange('username', value)}
                placeholder="Enter username"
                error={errors.username}
                disabled={isSubmitting}
              />

              {/* Email */}
              <FormField
                label="Email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={(value) => handleInputChange('email', value)}
                placeholder="user@example.com"
                error={errors.email}
                disabled={isSubmitting}
              />

              {/* Session Validity */}
              <FormField
                label="Session Validity"
                name="sessionValidity"
                type="select"
                value={(formData.sessionValidity || 86400000).toString()}
                onChange={(value) => handleInputChange('sessionValidity', parseInt(value))}
                disabled={isSubmitting}
                options={sessionValidityOptions.map(option => ({
                  value: option.value.toString(),
                  label: option.label
                }))}
              />

              {/* Record Status */}
              <FormField
                label="Record Status"
                name="recordStatus"
                type="select"
                value={(formData.recordStatus || '1').toString()}
                onChange={(value) => handleInputChange('recordStatus', value.toString())}
                disabled={isSubmitting}
                options={recordStatusHelpers.getSelectOptions()}
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
               {/* Display submit error if any */}
              {errors?.submit && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-800 text-sm">
                    <strong>Error:</strong> {errors.submit}
                  </div>
                </div>
              )}
              <ButtonGroup
                buttons={[
                  {
                    label: 'Cancel',
                    variant: 'outline',
                    onClick: handleCancel,
                    disabled: isSubmitting
                  },
                  {
                    label: isSubmitting ? 'Updating...' : 'Update User',
                    variant: 'primary',
                    type: 'submit',
                    loading: isSubmitting,
                    icon: <Save className="w-4 h-4" />
                  }
                ] as ButtonConfig[]}
              />
            </div>
          </RemixForm>
        </div>
      </div>
    </PageLayout>
  );
};

export default UserEdit; 