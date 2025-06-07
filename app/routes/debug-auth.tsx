import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getSecureAuthToken, getAuthSession } from "~/config/session.server";

interface DebugData {
  hasSecureToken: boolean;
  secureTokenPreview?: string;
  sessionData?: any;
  cookieHeader?: string;
  serverStoreInfo: {
    sessionCount: number;
    sessionIds: string[];
  };
  timestamp: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("🔍 DEBUG AUTH LOADER START");
  
  try {
    // Get cookie header
    const cookieHeader = request.headers.get("Cookie");
    console.log("🍪 Raw cookie header:", cookieHeader);
    
    // Try to get secure token
    const secureToken = await getSecureAuthToken(request);
    console.log("🔑 Secure token result:", secureToken ? "FOUND" : "NOT FOUND");
    
    // Get session data
    const sessionData = await getAuthSession(request);
    console.log("📊 Session data:", sessionData);
    
    // Get server store info
    const serverStoreInfo = {
      sessionCount: 0, // We'll need to export this from session.server.ts
      sessionIds: [] as string[]
    };
    
    const debugData: DebugData = {
      hasSecureToken: !!secureToken,
      secureTokenPreview: secureToken ? secureToken.substring(0, 50) + "..." : undefined,
      sessionData,
      cookieHeader: cookieHeader || undefined,
      serverStoreInfo,
      timestamp: new Date().toISOString()
    };
    
    console.log("✅ Debug data prepared:", debugData);
    
    return json(debugData);
  } catch (error) {
    console.error("❌ Debug auth loader error:", error);
    return json({
      hasSecureToken: false,
      sessionData: null,
      cookieHeader: undefined,
      serverStoreInfo: { sessionCount: 0, sessionIds: [] },
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default function DebugAuth() {
  const data = useLoaderData<DebugData>();
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔍 Authentication Debug
        </h1>
        
        <div className="space-y-6">
          {/* Timestamp */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">⏰ Debug Timestamp</h2>
            <p className="text-gray-700">{data.timestamp}</p>
          </div>
          
          {/* Cookie Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🍪 Cookie Information</h2>
            <div className="space-y-2">
              <p><strong>Cookie Header Present:</strong> {data.cookieHeader ? "Yes" : "No"}</p>
              {data.cookieHeader && (
                <div>
                  <p><strong>Cookie Content:</strong></p>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                    {data.cookieHeader}
                  </pre>
                </div>
              )}
            </div>
          </div>
          
          {/* Secure Token Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🔑 Secure Token Information</h2>
            <div className="space-y-2">
              <p><strong>Has Secure Token:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${data.hasSecureToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {data.hasSecureToken ? "Yes" : "No"}
                </span>
              </p>
              {data.secureTokenPreview && (
                <div>
                  <p><strong>Token Preview:</strong></p>
                  <pre className="bg-gray-100 p-3 rounded text-sm">
                    {data.secureTokenPreview}
                  </pre>
                </div>
              )}
            </div>
          </div>
          
          {/* Session Data */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Session Data</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(data.sessionData, null, 2)}
            </pre>
          </div>
          
          {/* Server Store Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">💾 Server Store Information</h2>
            <div className="space-y-2">
              <p><strong>Session Count:</strong> {data.serverStoreInfo.sessionCount}</p>
              <p><strong>Session IDs:</strong></p>
              <pre className="bg-gray-100 p-3 rounded text-sm">
                {JSON.stringify(data.serverStoreInfo.sessionIds, null, 2)}
              </pre>
            </div>
          </div>
          
          {/* Client-Side Debug */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🌐 Client-Side Debug</h2>
            <button
              onClick={() => {
                console.group('🔍 CLIENT-SIDE AUTH DEBUG');
                console.log('Current URL:', window.location.href);
                console.log('All Cookies:', document.cookie);
                console.log('LocalStorage authToken:', localStorage.getItem('authToken'));
                console.log('SessionStorage zen_secure_auth:', sessionStorage.getItem('zen_secure_auth'));
                
                // Check if authMigration is available
                if ((window as any).authMigration) {
                  const status = (window as any).authMigration.getAuthStatus();
                  console.log('Auth Migration Status:', status);
                } else {
                  console.log('Auth Migration utility not available');
                }
                
                console.groupEnd();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Run Client-Side Debug
            </button>
          </div>
          
          {/* Error Info */}
          {(data as any).error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-4">❌ Error Information</h2>
              <p className="text-red-700">{(data as any).error}</p>
            </div>
          )}
          
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">⚡ Quick Actions</h2>
            <div className="space-x-4">
              <a
                href="/login"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Go to Login
              </a>
              <a
                href="/dashboard"
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Go to Dashboard
              </a>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 