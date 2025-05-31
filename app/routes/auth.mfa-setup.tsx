import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { MfaSetupForm } from "~/components/forms/MfaSetupForm";
import { APIUtil } from "~/utils/api.util";

// Validation schema for MFA setup
const mfaSetupSchema = z.object({
  action: z.enum(["initiate", "enable"]),
  mfaCode: z.string().optional(),
  password: z.string().optional(),
}).refine((data) => {
  // For "enable" action, both mfaCode and password are required
  if (data.action === "enable") {
    return data.mfaCode && data.mfaCode.length === 6 && data.password && data.password.length > 0;
  }
  // For "initiate" action, no additional fields are required
  return true;
}, {
  message: "For enable action, both 6-digit MFA code and password are required",
  path: ["mfaCode"], // This will show the error on the mfaCode field
});

type ActionData = {
  error?: string;
  fieldErrors?: {
    mfaCode?: string[];
  };
  qrCodeUrl?: string;
  secret?: string;
  backupCodes?: string[];
  isSetupInitiated?: boolean;
};

type LoaderData = {
  username: string;
  qrCodeUrl?: string;
  secret?: string;
  backupCodes?: string[];
  isSetupInitiated: boolean;
};

// Loader to get username and check if setup is initiated
export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== MFA SETUP LOADER START ===");
  console.log("Request URL:", request.url);
  
  const url = new URL(request.url);
  const username = url.searchParams.get("username");
  
  console.log("Username from URL params:", username);
  
  if (!username) {
    console.log("=== NO USERNAME - REDIRECTING TO LOGIN ===");
    throw redirect("/login");
  }

  console.log("=== MFA SETUP LOADER SUCCESS ===");
  return json<LoaderData>({
    username,
    isSetupInitiated: false,
  });
}

// Action to handle MFA setup
export async function action({ request }: ActionFunctionArgs) {
  console.log("=== MFA SETUP ACTION START ===");
  
  const formData = await request.formData();
  const action = formData.get("action") as string;
  const mfaCodeRaw = formData.get("mfaCode") as string | null;
  const usernameRaw = formData.get("username") as string | null;
  const passwordRaw = formData.get("password") as string | null;

  // Convert null values to undefined for validation
  const mfaCode = mfaCodeRaw || undefined;
  const username = usernameRaw || undefined;
  const password = passwordRaw || undefined;

  console.log("=== MFA SETUP FORM DATA ===");
  console.log("Action:", action);
  console.log("Username:", username);
  console.log("MFA Code:", mfaCode || "none");
  console.log("Password:", password ? "[REDACTED]" : "none");
  console.log("All form entries:", Array.from(formData.entries()));

  if (!username) {
    console.log("=== ERROR: Username missing ===");
    return json({ error: "Username is required" }, { status: 400 });
  }

  console.log("=== VALIDATION START ===");
  const result = mfaSetupSchema.safeParse({ action, mfaCode, password });
  console.log("Validation result:", result);
  
  if (!result.success) {
    console.log("=== VALIDATION FAILED ===");
    console.log("Validation errors:", result.error.flatten());
    return json({ 
      error: "Invalid form data", 
      fieldErrors: result.error.flatten().fieldErrors 
    }, { status: 400 });
  }

  console.log("=== VALIDATION PASSED ===");

  try {
    const apiUtil = APIUtil.getInstance();

    if (result.data.action === "initiate") {
      console.log("=== INITIATING MFA SETUP ===");
      console.log("About to call apiUtil.initiateMfaSetup with username:", username);
      
      // Add a small delay to prevent rapid multiple calls
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log("=== GETTING API UTIL INSTANCE ===");
      console.log("APIUtil instance:", apiUtil);
      console.log("APIUtil methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(apiUtil)));
      
      console.log("=== CALLING INITIATE MFA SETUP ===");
      const response = await apiUtil.initiateMfaSetup(username);
      
      console.log("=== MFA SETUP INITIATION COMPLETE ===");
      console.log("Response received:", response);
      
      if (response.success && response.data) {
        console.log("=== MFA SETUP SUCCESS - RETURNING DATA ===");
        return json<ActionData>({
          qrCodeUrl: response.data.qrCodeUrl,
          secret: response.data.secret,
          backupCodes: (response.data as any).recoveryCodes || response.data.backupCodes,
          isSetupInitiated: true,
        });
      } else {
        console.log("=== MFA SETUP FAILED ===");
        console.log("Error:", response.error);
        return json({ error: response.error || "Failed to initiate MFA setup" }, { status: 500 });
      }
    } else if (result.data.action === "enable") {
      // Step 2: Verify MFA code and enable MFA
      if (!result.data.mfaCode) {
        return json({ error: "MFA code is required" }, { status: 400 });
      }

      if (!result.data.password) {
        return json({ error: "Password is required for MFA verification" }, { status: 400 });
      }

      console.log("Verifying MFA setup...");
      const response = await apiUtil.verifyMfaSetup(username, result.data.password, result.data.mfaCode);
      
      if (response.success && response.data?.token) {
        // MFA setup successful, redirect to dashboard
        return redirect("/dashboard");
      } else {
        return json({ error: response.error || "Invalid MFA code" }, { status: 400 });
      }
    }

    console.log("=== INVALID ACTION ===");
    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.log("=== EXCEPTION IN MFA SETUP ===");
    console.error("MFA setup error:", error);
    return json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export default function MfaSetup() {
  console.log("=== MFA SETUP COMPONENT START ===");
  
  const loaderData = useLoaderData<LoaderData>();
  console.log("=== LOADER DATA RETRIEVED ===");
  console.log("Loader data:", loaderData);
  
  const actionData = useActionData<ActionData>();
  console.log("=== ACTION DATA RETRIEVED ===");
  console.log("Action data:", actionData);

  // Use action data for QR code info if available, otherwise use loader data
  const qrCodeUrl = actionData?.qrCodeUrl || loaderData.qrCodeUrl;
  const secret = actionData?.secret || loaderData.secret;
  const backupCodes = actionData?.backupCodes || loaderData.backupCodes;
  const isSetupInitiated = actionData?.isSetupInitiated || loaderData.isSetupInitiated;

  console.log("=== MFA SETUP COMPONENT RENDER ===");
  console.log("About to render MfaSetupForm with props:");
  console.log("- username:", loaderData.username);
  console.log("- isSetupInitiated:", isSetupInitiated);
  console.log("- qrCodeUrl:", qrCodeUrl);
  console.log("- secret:", secret);
  console.log("- backupCodes:", backupCodes);
  console.log("- error:", actionData?.error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <MfaSetupForm
          username={loaderData.username}
          qrCodeUrl={qrCodeUrl}
          secret={secret}
          backupCodes={backupCodes}
          isSetupInitiated={isSetupInitiated}
          error={actionData?.error}
          fieldErrors={actionData?.fieldErrors}
        />
      </div>
    </div>
  );
} 