import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { getSecureAuthToken } from "~/config/session.server";
import { UserService } from "~/services";

/**
 * Server-side API Proxy - handles sensitive API calls without exposing tokens to browser
 * 
 * SECURITY ENHANCEMENT: Now uses secure session authentication where tokens are stored server-side
 * and only session IDs are sent to browser - NO TOKENS VISIBLE IN NETWORK REQUESTS!
 * 
 * Usage from client:
 * fetch('/api/proxy', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     endpoint: '/users/123/toggle-status',
 *     method: 'PATCH',
 *     data: { someData: 'value' }
 *   })
 * })
 */

interface ProxyRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  params?: Record<string, string>;
}

export async function action({ request }: ActionFunctionArgs) {
  console.log("=== API PROXY ACTION START ===");
  
  // SECURITY: Use secure session authentication - no tokens in cookies!
  const authToken = await getSecureAuthToken(request);
  
  if (!authToken) {
    console.log("❌ No secure session found, authentication required");
    return json({ 
      success: false, 
      error: "Authentication required" 
    }, { status: 401 });
  }
  
  console.log("✅ Secure session authenticated");

  try {
    const proxyRequest: ProxyRequest = await request.json();
    console.log("Proxy request:", proxyRequest);

    const { endpoint, method, data, params } = proxyRequest;

    // Validate request
    if (!endpoint || !method) {
      return json({ 
        success: false, 
        error: "Missing endpoint or method" 
      }, { status: 400 });
    }

    // Initialize user service with server-side token
    const userService = UserService.getInstance();
    userService.setServerAuthToken(authToken);

    let result;

    // Route to appropriate service method based on endpoint
    try {
      result = await routeApiCall(endpoint, method, data, params || null, userService);
    } finally {
      // Always clear server-side token after use
      userService.clearServerAuthToken();
    }

    console.log("✅ Secure API Proxy result:", result);
    return json(result);

  } catch (error) {
    console.error("❌ Secure API Proxy error:", error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 });
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Handle GET requests through query parameters
  const url = new URL(request.url);
  const endpoint = url.searchParams.get('endpoint');
  const method = url.searchParams.get('method') || 'GET';

  if (!endpoint) {
    return json({ 
      success: false, 
      error: "Missing endpoint parameter" 
    }, { status: 400 });
  }

  // SECURITY: Use secure session authentication - no tokens in cookies!
  const authToken = await getSecureAuthToken(request);
  
  if (!authToken) {
    console.log("❌ No secure session found for GET request");
    return json({ 
      success: false, 
      error: "Authentication required" 
    }, { status: 401 });
  }

  const userService = UserService.getInstance();
  userService.setServerAuthToken(authToken);

  try {
    const result = await routeApiCall(endpoint, method as any, null, null, userService);
    console.log("✅ Secure GET proxy result:", result);
    return json(result);
  } catch (error) {
    console.error("❌ Secure API Proxy loader error:", error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 });
  } finally {
    userService.clearServerAuthToken();
  }
}

async function routeApiCall(
  endpoint: string,
  method: string,
  data: any,
  params: Record<string, string> | null,
  userService: UserService
) {
  console.log(`Routing API call: ${method} ${endpoint}`);

  // User Management Operations
  if (endpoint.includes('/users/') && endpoint.includes('/toggle-status')) {
    const userId = extractUserIdFromEndpoint(endpoint);
    if (!userId) throw new Error("Invalid user ID in endpoint");
    
    return await userService.toggleUserStatus(userId);
  }

  if (endpoint.includes('/users/') && endpoint.includes('/reset-password')) {
    const userId = extractUserIdFromEndpoint(endpoint);
    if (!userId) throw new Error("Invalid user ID in endpoint");
    
    return await userService.resetUserPassword(userId);
  }

  if (endpoint.includes('/users/') && endpoint.includes('/reset-mfa')) {
    const userId = extractUserIdFromEndpoint(endpoint);
    if (!userId) throw new Error("Invalid user ID in endpoint");
    
    return await userService.resetUserMFA(userId);
  }

  if (endpoint.includes('/users/') && endpoint.includes('/toggle-mfa')) {
    const userId = extractUserIdFromEndpoint(endpoint);
    if (!userId) throw new Error("Invalid user ID in endpoint");
    
    const enabled = data?.enabled === true;
    return await userService.toggleUserMFA(userId, enabled);
  }

  if (endpoint.includes('/users/') && endpoint.includes('/security-status')) {
    const userId = extractUserIdFromEndpoint(endpoint);
    if (!userId) throw new Error("Invalid user ID in endpoint");
    
    return await userService.getUserSecurityStatus(userId);
  }

  if (endpoint.includes('/users/') && method === 'GET') {
    const userId = extractUserIdFromEndpoint(endpoint);
    if (!userId) throw new Error("Invalid user ID in endpoint");
    
    return await userService.getUserById(userId);
  }

  if (endpoint.includes('/users/') && method === 'PUT') {
    const userId = extractUserIdFromEndpoint(endpoint);
    if (!userId) throw new Error("Invalid user ID in endpoint");
    
    return await userService.updateUser(userId, data);
  }

  if (endpoint === '/users' && method === 'GET') {
    return await userService.getAllUsers();
  }

  if (endpoint === '/users' && method === 'POST') {
    return await userService.createUser(data);
  }

  // Add more route mappings as needed...

  throw new Error(`Unsupported endpoint: ${method} ${endpoint}`);
}

function extractUserIdFromEndpoint(endpoint: string): string | null {
  // Extract user ID from endpoints like '/users/{userId}/action'
  const matches = endpoint.match(/\/users\/([^\/]+)/);
  return matches ? matches[1] : null;
} 