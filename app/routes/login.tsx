import { redirect, json, type ActionFunctionArgs } from "@remix-run/node";
import { useActionData, useNavigation } from "@remix-run/react";
import { useEffect } from "react";
import { z } from "zod";
import { LoginForm } from "~/components/forms/LoginForm";
import { APIUtil, type LoginRequest } from "~/utils/api.util";
import { GlobalAlertMessageHandler } from "~/utils/alert.util";
import { createAuthCookie } from "~/config/session.server";

// Validation schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  mfaCode: z.string().optional()
});

// Type for action data
type ActionData = {
  error?: string;
  fieldErrors?: {
    username?: string[];
    password?: string[];
    mfaCode?: string[];
  };
  showMfaField?: boolean; // Flag to show MFA field automatically
};

// Note: Using createAuthCookie from ~/config/session.server

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
        console.log("Token received:", data.token.substring(0, 20) + "...");
        
        console.log("=== CREATING AUTH COOKIE ===");
        const cookieValue = createAuthCookie(data.token);
        console.log("Cookie value:", cookieValue);
        
        console.log("=== SETTING REDIRECT FLAG AND USING SERVER REDIRECT ===");
        console.log("Using traditional redirect() to force navigation");
        
        // Store a flag in client-side for redirect detection
        return redirect("/dashboard", {
          headers: {
            "Set-Cookie": cookieValue,
          },
        });
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
        console.log("Token received:", data.token.substring(0, 20) + "...");
        
        console.log("Creating MFA redirect response with cookie");
        
        console.log("=== CREATING MFA AUTH COOKIE ===");
        const cookieValue = createAuthCookie(data.token);
        console.log("Cookie value:", cookieValue);
        
        console.log("=== MFA SERVER REDIRECT ===");
        console.log("Using traditional redirect() for MFA success");
        
        return redirect("/dashboard", {
          headers: {
            "Set-Cookie": cookieValue,
          },
        });
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
  const navigation = useNavigation();

  console.log("=== LOGIN COMPONENT RENDER ===");
  console.log("actionData:", actionData);
  console.log("navigation state:", navigation.state);

  useEffect(() => {
    console.log("=== LOGIN COMPONENT MOUNTED ===");
    console.log("Navigation state:", navigation.state);
    console.log("Navigation location:", navigation.location);
    
    return () => {
      console.log("=== LOGIN COMPONENT UNMOUNTED ===");
    };
  }, []);

  useEffect(() => {
    console.log("=== NAVIGATION STATE CHANGED ===");
    console.log("Current navigation state:", navigation.state);
    console.log("Current navigation location:", navigation.location);
    
    if (navigation.state === "loading") {
      console.log("Login component is loading/navigating");
    } else if (navigation.state === "idle") {
      console.log("Login component is idle");
    }
  }, [navigation.state, navigation.location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm 
          error={actionData?.error}
          fieldErrors={actionData?.fieldErrors}
          showMfaField={actionData?.showMfaField}
        />

        {/* Additional Info */}
        <div className="text-center mt-6">
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