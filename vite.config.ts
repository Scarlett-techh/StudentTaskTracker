import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd(), "");

  // Use the same port as the server (from environment variable PORT, fallback to 5000)
  const serverPort = env.PORT ? parseInt(env.PORT) : 5000;

  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
        ? [
            import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer(),
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      host: true, // Listen on all addresses (including 0.0.0.0)
      port: serverPort,  // Use the server's port for development
      strictPort: true, // Throw error if port is taken
      proxy: {
        "/api": {
          target: `http://0.0.0.0:${serverPort}`, // Update to use 0.0.0.0
          changeOrigin: true,
          secure: false,
          // Additional configuration for WebSocket proxy if needed
          ws: true,
        },
      },
    },
    // Replit-specific configuration
    define: {
      "process.env.REPL_ID": JSON.stringify(process.env.REPL_ID),
      "process.env.REPL_OWNER": JSON.stringify(process.env.REPL_OWNER),
      "process.env.REPL_SLUG": JSON.stringify(process.env.REPL_SLUG),
    },
  };
});