import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { clearSecureSession } from "~/config/session.server";

/**
 * Logout route that properly clears secure authentication session
 * This is a loader-only route - GET requests to /logout will trigger logout
 */
export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== LOGOUT ROUTE ACCESSED ===");
  
  try {
    // Clear secure session - removes server-side token storage and session cookie
    console.log("Clearing secure authentication session");
    
    const clearResponse = await clearSecureSession(request);
    
    return redirect("/login", {
      headers: clearResponse.headers, // Clear session cookie
    });
  } catch (error) {
    console.error("Logout error:", error);
    // Even if logout fails, still redirect to login with session clear attempt
    const clearResponse = await clearSecureSession(request);
    return redirect("/login", {
      headers: clearResponse.headers,
    });
  }
} 