import React, { useState } from 'react';
import { UserPlus, Save } from 'lucide-react';
import { useNavigate, Form as RemixForm } from '@remix-run/react';
import { PageLayout } from '~/components/layout/PageLayout';
import { FormField, ButtonGroup, Alert } from '~/components';
import type { ButtonConfig } from '~/components';
import { CreateUserRequest } from '~/types/user.type';
import { type LoaderFunctionArgs, type ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { useActionData, useNavigation } from "@remix-run/react";
import { UserService } from "~/services";
import { getSecureAuthToken } from "~/config/session.server";
import { JWTUtil } from "~/config/session.server";
import { APIUtil } from "~/utils/api.util";

// Loader function to protect the route
export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== USER INSERT LOADER START ===");
  
  // Use secure session authentication
  const authToken = await getSecureAuthToken(request);
  
  if (!authToken) {
    console.log("❌ No secure session found, redirecting to login");
    throw redirect("/login");
  }
  
  console.log("User insert auth token found:", authToken.substring(0, 20) + "...");
  console.log("User insert authentication passed, allowing access");
  
  return null;
}

// Action function to handle form submission
export async function action({ request }: ActionFunctionArgs) {
  console.log("=== USER INSERT ACTION START ===");
  
  // Use secure session authentication
  const authToken = await getSecureAuthToken(request);
  
  if (!authToken) {
    console.log("❌ No secure session found, redirecting to login");
    throw redirect("/login");
  }
  
  console.log("User insert action auth token found:", authToken.substring(0, 20) + "...");
  console.log("Session data:", {
    isAuthenticated: true,
    hasToken: !!authToken,
    tokenLength: authToken?.length,
    user: {
      // Placeholder for user information
    }
  });
  
  try {
    const formData = await request.formData();
    
    console.log("Session user:", {
      // Placeholder for user information
    });

    // Enhanced JWT Token Debugging
    if (authToken) {
      JWTUtil.logTokenInfo(authToken);
    }

    // Use hashed user ID directly from enhanced JWT (backend handles all hashing)
    let hashedCreatedByValue: string = "";
    
    if (authToken) {
      // Use hashed user ID from enhanced JWT token as-is
      hashedCreatedByValue = authToken;
      console.log("Using enhanced JWT hashed user ID for hashedCreatedBy:", hashedCreatedByValue.substring(0, 20) + "...");
    } else {
      // Fallback for standard JWT tokens - use username or numeric ID
      if (authToken) {
        hashedCreatedByValue = authToken;
        console.log("Using username for hashedCreatedBy (fallback):", hashedCreatedByValue);
      } else if (authToken) {
        hashedCreatedByValue = authToken;
        console.log("Using numeric user ID for hashedCreatedBy (fallback):", hashedCreatedByValue);
      } else {
        console.warn("No user identifier available for hashedCreatedBy");
        // Set a default value or handle gracefully
        hashedCreatedByValue = "unknown_user";
      }
    }

    // Extract form data
    const userData: CreateUserRequest = {
      username: formData.get('username')?.toString() || '',
      firstName: formData.get('firstName')?.toString() || '',
      lastName: formData.get('lastName')?.toString() || '',
      email: formData.get('email')?.toString() || '',
      mobileNumber: formData.get('mobileNumber')?.toString() || undefined,
      dateOfBirth: formData.get('dateOfBirth')?.toString() || undefined,
      gender: formData.get('gender')?.toString() || undefined,
      address: formData.get('address')?.toString() || undefined,
      profilePictureUrl: formData.get('profilePictureUrl')?.toString() || undefined,
      sessionValidity: parseInt(formData.get('sessionValidity')?.toString() || '86400000'),
      hashedCreatedBy: hashedCreatedByValue, // Send hashed user ID as-is to backend
    };

    console.log("Action received user data:", userData);

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!userData.username.trim()) errors.username = 'Username is required';
    if (!userData.firstName.trim()) errors.firstName = 'First name is required';
    if (!userData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!userData.email.trim()) errors.email = 'Email is required';

    if (Object.keys(errors).length > 0) {
      console.log("Validation errors:", errors);
      return json({ errors, userData });
    }

    // Create user using UserService
    const userService = UserService.getInstance();
    
    console.log("About to inject auth token into UserService");
    
    // Inject the server-side auth token
    if (authToken) {
      console.log("Injecting token:", authToken.substring(0, 20) + "...");
      userService.setServerAuthToken(authToken);
    } else {
      console.error("No auth token available to inject!");
      return json({ 
        errors: { submit: 'Authentication token not available' }, 
        userData 
      });
    }
    
    console.log("Calling userService.createUser");
    const result = await userService.createUser(userData);
    console.log("UserService.createUser result:", result);
    
    // Clear the server-side token after use
    userService.clearServerAuthToken();
    
    if (result.success) {
      console.log("User created successfully:", result.data);
      // Redirect to user management page
      return redirect('/dashboard/user-administration/user-management');
    } else {
      console.error("Failed to create user:", result.error);
      
      // Check if this is a permission/authorization issue
      let errorMessage = result.error || 'Failed to create user';
      if (result.error === 'Authentication failed' || result.error?.includes('Unauthorized')) {
        errorMessage = 'Permission denied: Your account does not have permission to create users. Please contact your system administrator to grant user creation permissions to your role.';
      } else if (result.error?.includes('400') || result.error?.includes('deserialize')) {
        // Backend may not be updated to accept hashed field names yet
        errorMessage = `Backend API mismatch detected. This indicates:
1. Backend may still expect numeric user IDs instead of hashed field names
2. Enhanced JWT API integration may be in progress  
3. Backend implementation may not match the specification yet

Please coordinate with backend team to verify:
- API endpoints accept 'hashedCreatedBy' field names
- Enhanced JWT integration is fully implemented
- Backend returns 'hashedUserId' in responses

Original error: ${result.error}`;
      }
      
      return json({ 
        errors: { submit: errorMessage }, 
        userData 
      });
    }
    
  } catch (error) {
    console.error("Action error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack');
    return json({ 
      errors: { submit: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` }
    });
  }
}

interface ActionData {
  errors?: Record<string, string>;
  userData?: CreateUserRequest;
}

const UserInsert: React.FC = () => {
  const navigate = useNavigate();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    profilePictureUrl: '',
    sessionValidity: 86400000, // 24 hours default
    hashedCreatedBy: 'user_1' // Default compatibility format
  });

  // Use action data for errors and form restoration
  const errors = actionData?.errors || {};

  // Restore form data if there were validation errors
  React.useEffect(() => {
    if (actionData?.userData) {
      setFormData(actionData.userData);
    }
  }, [actionData]);

  // Handle form input changes
  const handleInputChange = (field: keyof CreateUserRequest, value: string | number) => {
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

  return (
    <PageLayout
      title="Add New User"
      icon={<UserPlus />}
    >
      <div className="max-w-4xl mx-auto">
        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <RemixForm method="post">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <FormField
                label="Username"
                name="username"
                type="text"
                value={formData.username}
                onChange={(value) => handleInputChange('username', value)}
                placeholder="Enter username"
                required={true}
                error={errors?.username}
                disabled={isSubmitting}
              />

              {/* Email */}
              <FormField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(value) => handleInputChange('email', value)}
                placeholder="user@example.com"
                required={true}
                error={errors?.email}
                disabled={isSubmitting}
              />

              {/* First Name */}
              <FormField
                label="First Name"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={(value) => handleInputChange('firstName', value)}
                placeholder="Enter first name"
                required={true}
                error={errors?.firstName}
                disabled={isSubmitting}
              />

              {/* Last Name */}
              <FormField
                label="Last Name"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={(value) => handleInputChange('lastName', value)}
                placeholder="Enter last name"
                required={true}
                error={errors?.lastName}
                disabled={isSubmitting}
              />

              {/* Mobile Number */}
              <FormField
                label="Mobile Number"
                name="mobileNumber"
                type="text"
                value={formData.mobileNumber || ''}
                onChange={(value) => handleInputChange('mobileNumber', value)}
                placeholder="+1234567890"
                error={errors?.mobileNumber}
                disabled={isSubmitting}
              />

              {/* Date of Birth */}
              <FormField
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth || ''}
                onChange={(value) => handleInputChange('dateOfBirth', value)}
                error={errors?.dateOfBirth}
                disabled={isSubmitting}
              />

              {/* Gender */}
              <FormField
                label="Gender"
                name="gender"
                type="select"
                value={formData.gender || ''}
                onChange={(value) => handleInputChange('gender', value)}
                disabled={isSubmitting}
                options={[
                  { value: '', label: 'Select gender' },
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' }
                ]}
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

            {/* Address - Full Width */}
            <FormField
              label="Address"
              name="address"
              type="textarea"
              value={formData.address || ''}
              onChange={(value) => handleInputChange('address', value)}
              placeholder="Enter address"
              error={errors?.address}
              disabled={isSubmitting}
            />

            {/* Profile Picture URL */}
            <FormField
              label="Profile Picture URL"
              name="profilePictureUrl"
              type="url"
              value={formData.profilePictureUrl || ''}
              onChange={(value) => handleInputChange('profilePictureUrl', value)}
              placeholder="https://example.com/profile.jpg"
              error={errors?.profilePictureUrl}
              disabled={isSubmitting}
            />

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
                    label: isSubmitting ? 'Creating...' : 'Create User',
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

export default UserInsert; 