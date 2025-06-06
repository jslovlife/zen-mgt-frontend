import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useEffect } from "react";
import { ThemeManager } from "~/utils/theme.util";

import "./tailwind.css";
import "./styles/design-tokens.css";
import "./styles/components/input.css";
import "./styles/components/button.css";
import "./styles/components/breadcrumb.css";
import "./styles/components/login-form.css";
import "./styles/components/dashboard.css";
import "./styles/components/data-table.css";
import "./styles/global-overrides.css"; // Global browser overrides - must be last

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  // Add additional fonts for themes
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Source+Sans+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700;1,900&display=swap",
  },
];

// Loader to pass environment variables to the client
export async function loader({ request }: LoaderFunctionArgs) {
  return json({
    ENV: {
      API_URL: process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:8080',
    },
  });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();
  
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        {/* Pass environment variables to the client */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // Initialize theme system on app startup
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const themeManager = ThemeManager.getInstance();
        await themeManager.initializeTheme();
      } catch (error) {
        console.error("Failed to initialize theme:", error);
      }
    };

    initializeTheme();
  }, []);

  return (
    <>
      <Outlet />
    </>
  );
}
