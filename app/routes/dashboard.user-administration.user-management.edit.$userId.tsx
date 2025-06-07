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
import { getSecureAuthToken } from "~/config/session.server";
import { DateTimeUtil } from "~/utils/datetime.util";
import { useEnums } from "~/routes/dashboard";
import { useRecordStatusHelpers } from "~/hooks/useEnums";
import { secureApi } from "~/utils/secure-api.util";

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
  
  // SECURITY: Use secure session authentication - no tokens in cookies!
  const authToken = await getSecureAuthToken(request);
  
  if (!authToken) {
    console.log("❌ No secure session found, redirecting to login");
    throw redirect("/login");
  }
  
  console.log("✅ Secure session authenticated");

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
    userService.setServerAuthToken(authToken);
    console.log("Using secure session token for user fetch");
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
  
  // SECURITY: Use secure session authentication - no tokens in cookies!
  const authToken = await getSecureAuthToken(request);
  
  if (!authToken) {
    console.log("❌ No secure session found for action");
    return json({ errors: { submit: "Authentication required" } }, { status: 401 });
  }
  
  console.log("✅ Secure session authenticated for action");

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
    const actionType = formData.get('_action')?.toString();
    
    const userService = UserService.getInstance();
    userService.setServerAuthToken(authToken);

    // Handle different action types
    if (actionType === 'resetPassword') {
      const result = await userService.resetUserPassword(hashedUserIdFromParams);
      userService.clearServerAuthToken();
      
      if (result.success) {
        console.log("Password reset successfully");
        return json({ success: true, message: "Password reset successfully" });
      } else {
        console.error("Failed to reset password:", result.error);
        return json({ errors: { submit: result.error || 'Failed to reset password' } });
      }
    }
    
    if (actionType === 'resetMFA') {
      const result = await userService.resetUserMFA(hashedUserIdFromParams);
      userService.clearServerAuthToken();
      
      if (result.success) {
        console.log("MFA reset successfully");
        return json({ success: true, message: "MFA reset successfully" });
      } else {
        console.error("Failed to reset MFA:", result.error);
        return json({ errors: { submit: result.error || 'Failed to reset MFA' } });
      }
    }
    
    if (actionType === 'toggleMFA') {
      const enabled = formData.get('enabled')?.toString() === 'true';
      const result = await userService.toggleUserMFA(hashedUserIdFromParams, enabled);
      userService.clearServerAuthToken();
      
      if (result.success) {
        console.log("MFA toggled successfully");
        return json({ success: true, message: `MFA ${enabled ? 'enabled' : 'disabled'} successfully` });
      } else {
        console.error("Failed to toggle MFA:", result.error);
        return json({ errors: { submit: result.error || 'Failed to toggle MFA' } });
      }
    }
    
    // Default action: update user
    const updateData: UpdateUserRequest = {
      username: formData.get('username')?.toString(),
      email: formData.get('email')?.toString(),
      sessionValidity: parseInt(formData.get('sessionValidity')?.toString() || '86400000'),
      // Removed recordStatus as it's no longer editable
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

  // Security status state
  const [securityStatus, setSecurityStatus] = useState<{
    encryptedUserId: string;
    username: string;
    password: {
      hasPassword: boolean;
      lastUpdated: string;
    };
    mfa: {
      enabled: boolean;
      enforced: boolean;
      hasSecret: boolean;
      hasRecoveryCodes: boolean;
      setupRequired: boolean;
    };
    recordStatus: string;
    lastLoginAt: string;
    createdAt: string;
  } | null>(null);
  const [loadingSecurityStatus, setLoadingSecurityStatus] = useState(true);

  // Initialize form data directly from loader data or action data (if form submission failed)
  const [formData, setFormData] = useState<UpdateUserRequest>(() => {
    if (actionData?.updateData) {
      return actionData.updateData; // Repopulate from failed submission
    }
    return {
      username: initialUser?.username || '',
      email: initialUser?.email || '',
      sessionValidity: initialUser?.sessionValidity || 86400000,
      // Removed recordStatus as it's no longer editable
    };
  });

  // Load security status
  useEffect(() => {
    const loadSecurityStatus = async () => {
      if (!initialUser?.hashedUserId) return;
      
      try {
        setLoadingSecurityStatus(true);
        
        // Use secure API - no tokens exposed in browser network!
        const result = await secureApi.getUserSecurityStatus(initialUser.hashedUserId);
        
        if (result.success && result.data) {
          setSecurityStatus(result.data);
        } else {
          console.error("Failed to load security status:", result.error);
        }
      } catch (error) {
        console.error("Error loading security status:", error);
      } finally {
        setLoadingSecurityStatus(false);
      }
    };

    loadSecurityStatus();
  }, [initialUser?.hashedUserId]);

  // Update form data if initialUser changes (e.g., after loader re-runs)
  useEffect(() => {
    if (initialUser && !actionData?.updateData) { // Only update if not repopulating from a failed submit
      setFormData({
        username: initialUser.username || '',
        email: initialUser.email || '',
        sessionValidity: initialUser.sessionValidity || 86400000,
        // Removed recordStatus as it's no longer editable
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

  // Handle reset password - SECURE: No tokens in browser network
  const handleResetPassword = async () => {
    if (confirm(`Are you sure you want to reset the password for user "${initialUser.username}"?`)) {
      try {
        const result = await secureApi.resetUserPassword(initialUser.hashedUserId);
        
        if (result.success) {
          alert('Password reset successfully!');
          // Reload security status
          window.location.reload();
        } else {
          alert(`Error: ${result.error || 'Failed to reset password'}`);
        }
      } catch (error) {
        alert(`Error: ${error instanceof Error ? error.message : 'Failed to reset password'}`);
      }
    }
  };

  // Handle reset MFA - SECURE: No tokens in browser network
  const handleResetMFA = async () => {
    if (confirm(`Are you sure you want to reset the MFA for user "${initialUser.username}"? This will disable MFA and remove all MFA settings.`)) {
      try {
        const result = await secureApi.resetUserMFA(initialUser.hashedUserId);
        
        if (result.success) {
          alert('MFA reset successfully!');
          // Reload security status
          window.location.reload();
        } else {
          alert(`Error: ${result.error || 'Failed to reset MFA'}`);
        }
      } catch (error) {
        alert(`Error: ${error instanceof Error ? error.message : 'Failed to reset MFA'}`);
      }
    }
  };

  // Handle toggle MFA - SECURE: No tokens in browser network
  const handleToggleMFA = async (enabled: boolean) => {
    const action = enabled ? 'enable' : 'disable';
    const confirmMessage = enabled 
      ? `Are you sure you want to enable MFA for user "${initialUser.username}"? The user must have completed MFA setup first.`
      : `Are you sure you want to disable MFA for user "${initialUser.username}"?`;
      
    if (confirm(confirmMessage)) {
      try {
        const result = await secureApi.toggleUserMFA(initialUser.hashedUserId, enabled);
        
        if (result.success) {
          alert(`MFA ${action}d successfully!`);
          // Reload security status
          window.location.reload();
        } else {
          alert(`Error: ${result.error || `Failed to ${action} MFA`}`);
        }
      } catch (error) {
        alert(`Error: ${error instanceof Error ? error.message : `Failed to ${action} MFA`}`);
      }
    }
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
                Status: {recordStatusHelpers.getDisplayByCode(parseInt(initialUser.recordStatus?.toString() || '1'))} (Read-only)
              </p>
            </div>
            <div className="text-right text-sm text-purple-600">
              <div>Created: {DateTimeUtil.forTableDateTime(initialUser.createdAt)}</div>
              <div>Last Updated: {DateTimeUtil.forTableDateTime(initialUser.updatedAt)}</div>
            </div>
          </div>
        </div>

        {/* Security Status Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-medium text-blue-900 mb-3">Security Status</h4>
          {loadingSecurityStatus ? (
            <div className="text-blue-700">Loading security status...</div>
          ) : securityStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-blue-800 mb-2">Password</h5>
                <div className="text-sm text-blue-700">
                  <div>Has Password: {securityStatus.password.hasPassword ? '✅ Yes' : '❌ No'}</div>
                  {securityStatus.password.hasPassword && (
                    <div>Last Updated: {DateTimeUtil.forTableDateTime(securityStatus.password.lastUpdated)}</div>
                  )}
                </div>
              </div>
              <div>
                <h5 className="font-medium text-blue-800 mb-2">Multi-Factor Authentication</h5>
                <div className="text-sm text-blue-700">
                  <div>Enabled: {securityStatus.mfa.enabled ? '✅ Yes' : '❌ No'}</div>
                  <div>Has Secret: {securityStatus.mfa.hasSecret ? '✅ Yes' : '❌ No'}</div>
                  <div>Has Recovery Codes: {securityStatus.mfa.hasRecoveryCodes ? '✅ Yes' : '❌ No'}</div>
                  <div>Setup Required: {securityStatus.mfa.setupRequired ? '⚠️ Yes' : '✅ No'}</div>
                  <div>Enforced: {securityStatus.mfa.enforced ? '🔒 Yes' : '🔓 No'}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-red-700">Failed to load security status</div>
          )}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <RemixForm method="post">
            {/* Add a hidden field for ID if necessary, or rely on params in action */}
            {/* <input type="hidden" name="hashedUserId" value={initialUser.hashedUserId} /> */}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

              {/* Reset Actions */}
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Security Actions</h5>
                
                {/* Password Actions */}
                <div className="mb-4">
                  <h6 className="text-xs font-medium text-gray-600 mb-2">Password Management</h6>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={isSubmitting}
                      className="px-3 py-2 text-sm font-medium text-orange-700 bg-orange-100 border border-orange-300 rounded-md hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reset Password
                    </button>
                  </div>
                </div>

                {/* MFA Actions */}
                <div className="mb-4">
                  <h6 className="text-xs font-medium text-gray-600 mb-2">Multi-Factor Authentication</h6>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleResetMFA}
                      disabled={isSubmitting}
                      className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reset MFA
                    </button>
                    
                    {securityStatus && securityStatus.mfa.hasSecret && (
                      <>
                        {!securityStatus.mfa.enabled ? (
                          <button
                            type="button"
                            onClick={() => handleToggleMFA(true)}
                            disabled={isSubmitting}
                            className="px-3 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Enable MFA
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleMFA(false)}
                            disabled={isSubmitting}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Disable MFA
                          </button>
                        )}
                      </>
                    )}
                    
                    {securityStatus && !securityStatus.mfa.hasSecret && (
                      <span className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-md">
                        MFA Setup Required
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Action Buttons */}
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