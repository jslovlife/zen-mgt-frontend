import { ActionFunctionArgs, json, redirect, LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, useSearchParams } from "@remix-run/react";
import { z } from "zod";
import { MfaVerificationForm, MfaVerificationFormData } from "~/components/forms/MfaVerificationForm";
import { APIUtil } from "~/utils/api.util";

// Validation schema
const mfaVerificationSchema = z.object({
  mfaCode: z.string().length(6, "MFA code must be exactly 6 digits").regex(/^\d+$/, "MFA code must contain only numbers"),
});

// Type for action data
type ActionData = {
  error: string;
  fieldErrors?: {
    mfaCode?: string[];
  };
};

// Type for loader data
type LoaderData = {
  username?: string;
  hasTempToken: boolean;
};

// Loader function to check if user has temp token
export async function loader({ request }: LoaderFunctionArgs) {
  const apiUtil = APIUtil.getInstance();
  
  // Check if user has a temp token (required for MFA verification)
  if (!apiUtil.hasTempToken()) {
    return redirect("/login");
  }

  // Get username from URL params or session if available
  const url = new URL(request.url);
  const username = url.searchParams.get("username");

  return json<LoaderData>({
    username: username || undefined,
    hasTempToken: true,
  });
}

// Action function to handle MFA verification
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const mfaCode = formData.get("mfaCode") as string;

  // Validate the form data
  const result = mfaVerificationSchema.safeParse({ mfaCode });
  
  if (!result.success) {
    return json({ 
      error: "Invalid MFA code format", 
      fieldErrors: result.error.flatten().fieldErrors 
    }, { status: 400 });
  }

  try {
    const apiUtil = APIUtil.getInstance();
    
    // Check if temp token exists
    if (!apiUtil.hasTempToken()) {
      return json({ error: "Session expired. Please login again." }, { status: 401 });
    }

    const response = await apiUtil.verifyMfa(mfaCode);

    if (response.success && response.data?.token) {
      // MFA verification successful, redirect to dashboard
      return redirect("/dashboard");
    } else {
      const errorMessage = response.error || "MFA verification failed";
      return json({ error: errorMessage }, { status: response.status || 401 });
    }
  } catch (error) {
    return json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export default function MfaVerify() {
  const [searchParams] = useSearchParams();
  const username = searchParams.get("username");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <MfaVerificationForm email={username || ""} />
      </div>
    </div>
  );
} 