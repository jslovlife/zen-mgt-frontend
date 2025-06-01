import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
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

export function Layout({ children }: { children: React.ReactNode }) {
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
