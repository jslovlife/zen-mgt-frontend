import { useState } from "react";
import { APIUtil } from "~/utils/api.util";

export default function TestApi() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testMfaSetup = async () => {
    setLoading(true);
    setResult("Testing...");
    
    try {
      console.log("=== TESTING MFA SETUP API ===");
      const apiUtil = APIUtil.getInstance();
      const response = await apiUtil.initiateMfaSetup("superadmin");
      
      console.log("Test result:", response);
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error("Test error:", error);
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setResult("Testing login...");
    
    try {
      console.log("=== TESTING LOGIN API ===");
      const apiUtil = APIUtil.getInstance();
      const response = await apiUtil.login({
        username: "superadmin",
        password: "Admin@123"
      });
      
      console.log("Login test result:", response);
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error("Login test error:", error);
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Test Page</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testLogin}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Login API"}
          </button>
          
          <button
            onClick={testMfaSetup}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 ml-4"
          >
            {loading ? "Testing..." : "Test MFA Setup API"}
          </button>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {result || "No test run yet"}
          </pre>
        </div>
      </div>
    </div>
  );
} 