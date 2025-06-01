import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { createClearAuthCookie } from "~/config/session.server";

/**
 * Logout route that properly clears authentication
 * This is a loader-only route - GET requests to /logout will trigger logout
 */
export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== LOGOUT ROUTE ACCESSED ===");
  
  try {
    // Clear server-side authentication by setting the clear cookie header
    console.log("Clearing server-side authentication cookies");
    
    return redirect("/login", {
      headers: {
        "Set-Cookie": createClearAuthCookie(),
      },
    });
  } catch (error) {
    console.error("Logout error:", error);
    // Even if logout fails, still redirect to login with clear cookie
    return redirect("/login", {
      headers: {
        "Set-Cookie": createClearAuthCookie(),
      },
    });
  }
} 