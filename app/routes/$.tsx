import { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  
  // Handle Chrome DevTools requests silently
  if (url.pathname.includes('.well-known') || 
      url.pathname.includes('devtools') ||
      url.pathname.includes('favicon.ico')) {
    return new Response(null, { status: 404 });
  }
  
  // For other 404s, you might want to render a proper 404 page
  throw new Response("Not Found", { status: 404 });
}

export default function CatchAll() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-8">Page not found</p>
        <a 
          href="/" 
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
} 