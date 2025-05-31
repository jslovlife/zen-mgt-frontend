import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { z } from "zod";
import { LoginForm, LoginFormData } from "~/components/forms/LoginForm";
import { APIUtil, LoginRequest } from "~/utils/api.util";
import { GlobalAlertMessageHandler } from "~/utils/alert.util";

// Validation schema
const loginSchema = z.object({
  username: z.string().min(1, "Please enter your email or username"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  mfaCode: z.string().optional(), // Optional MFA code for scenario 3
});

// Type for action data
type ActionData = {
  error: string;
  fieldErrors?: {
    username?: string[];
    password?: string[];
    mfaCode?: string[];
  };
  showMfaField?: boolean; // Flag to show MFA field automatically
};

// Action function to handle form submission
export async function action({ request }: ActionFunctionArgs) {
  console.log("=== LOGIN ACTION START ===");
  
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const mfaCodeRaw = formData.get("mfaCode") as string | null;
  
  // Convert null or empty string to undefined for validation
  const mfaCode = mfaCodeRaw && mfaCodeRaw.trim() ? mfaCodeRaw.trim() : undefined;

  console.log("username", username);
  console.log("password", password ? "[REDACTED]" : "null/undefined");
  console.log("mfaCode", mfaCode || "none");
  console.log("formData entries:", Array.from(formData.entries()));

  // Validate the form data
  console.log("=== VALIDATION START ===");
  const result = loginSchema.safeParse({ 
    username, 
    password, 
    mfaCode
  });
  console.log("validation result:", result);
  
  if (!result.success) {
    console.log("=== VALIDATION FAILED ===");
    console.log("validation errors:", result.error.flatten());
    return json({ 
      error: "Invalid credentials", 
      fieldErrors: result.error.flatten().fieldErrors 
    }, { status: 400 });
  }

  console.log("=== VALIDATION PASSED ===");

  try {
    console.log("=== API CALL START ===");
    const apiUtil = APIUtil.getInstance();
    const credentials: LoginRequest = { 
      username: result.data.username, 
      password: result.data.password 
    };
    
    // Add MFA code if provided (for scenario 3)
    if (result.data.mfaCode && result.data.mfaCode.trim()) {
      credentials.mfaCode = result.data.mfaCode.trim();
      console.log("MFA code added to credentials");
    }

    console.log("credentials being sent:", {
      username: credentials.username,
      password: "[REDACTED]",
      mfaCode: credentials.mfaCode || "none"
    });

    const response = await apiUtil.login(credentials);
    console.log("=== API RESPONSE ===");
    console.log("response success:", response.success);
    console.log("response status:", response.status);
    console.log("response error:", response.error);
    console.log("response data:", response.data);

    if (response.success && response.data) {
      const data = response.data;
      console.log("=== PROCESSING SUCCESSFUL RESPONSE ===");

      // Scenario 1: Fresh user (no MFA) - gets token immediately
      if (data.token && !data.requireMfa && !data.requireMfaSetup) {
        console.log("Scenario 1: Direct login with token");
        return redirect("/dashboard");
      }

      // Scenario 2: User needs MFA setup
      if (data.requireMfaSetup) {
        console.log("Scenario 2: MFA setup required");
        const redirectUrl = `/auth/mfa-setup?username=${encodeURIComponent(result.data.username)}`;
        console.log("=== REDIRECTING TO MFA SETUP ===");
        console.log("Redirect URL:", redirectUrl);
        console.log("About to call redirect()...");
        return redirect(redirectUrl);
      }

      // Scenario 3: User with MFA enabled - needs MFA verification
      if (data.requireMfa && !result.data.mfaCode) {
        console.log("Scenario 3: MFA verification required - showing MFA field");
        return json({ 
          error: "Please enter your authentication code.",
          showMfaField: true 
        }, { status: 200 });
      }

      // Scenario 3: MFA verification successful
      if (data.token && result.data.mfaCode) {
        console.log("Scenario 3: MFA verification successful");
        return redirect("/dashboard");
      }

      // Fallback for unexpected response
      console.log("=== UNEXPECTED RESPONSE STRUCTURE ===");
      console.log("data structure:", data);
      const errorMessage = "Unexpected login response";
      return json({ error: errorMessage }, { status: 500 });
    } else {
      console.log("=== API CALL FAILED ===");
      console.log("response:", response);
      
      // Check if this is an MFA-required error but user didn't provide MFA code
      if (response.status === 401 && !result.data.mfaCode) {
        console.log("Login failed - might need MFA code");
        return json({ 
          error: "Login failed. If you have MFA enabled, please enter your authentication code.",
          showMfaField: true 
        }, { status: 200 });
      }
      
      const errorMessage = response.error || "Login failed";
      return json({ error: errorMessage }, { status: response.status || 401 });
    }
  } catch (error) {
    console.log("=== EXCEPTION CAUGHT ===");
    console.error("Login error:", error);
    return json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export default function Login() {
  const actionData = useActionData<ActionData>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <LoginForm 
          error={actionData?.error}
          fieldErrors={actionData?.fieldErrors}
          showMfaField={actionData?.showMfaField}
        />

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{" "}
            <a href="#" className="text-indigo-600 hover:text-indigo-500">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-indigo-600 hover:text-indigo-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 