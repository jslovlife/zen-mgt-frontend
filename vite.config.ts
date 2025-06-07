import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

installGlobals();

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
      ignoredRouteFiles: ["**/*.css"],
    }),
    tsconfigPaths(),
  ],
  build: {
    // Disable source maps in production for security
    sourcemap: process.env.NODE_ENV === 'development' && process.env.VITE_SOURCEMAP !== 'false',
    // Additional security settings
    minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
    rollupOptions: {
      output: {
        // Obfuscate chunk names in production
        manualChunks: process.env.NODE_ENV === 'production' ? undefined : undefined,
        chunkFileNames: process.env.NODE_ENV === 'production' ? 'assets/[hash].js' : 'assets/[name]-[hash].js',
        entryFileNames: process.env.NODE_ENV === 'production' ? 'assets/[hash].js' : 'assets/[name]-[hash].js',
        assetFileNames: process.env.NODE_ENV === 'production' ? 'assets/[hash].[ext]' : 'assets/[name]-[hash].[ext]'
      }
    }
  },
  // Development server security (optional)
  server: {
    // Only allow localhost in development
    host: process.env.NODE_ENV === 'development' ? 'localhost' : false,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
