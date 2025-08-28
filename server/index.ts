import express from "express";
import { setupLocalAuth } from "./localAuth.js";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic } from "./vite.js";

const app = express();

// Middleware
app.use(express.json());

// Auth
setupLocalAuth(app);

// API routes
await registerRoutes(app);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === "development") {
  // 🔹 Serve via Vite in dev mode
  const httpServer = app.listen(PORT, () => {
    console.log(`✅ Dev server running at http://localhost:${PORT}`);
  });
  await setupVite(app, httpServer);
} else {
  // 🔹 Serve built files in production
  serveStatic(app);
  app.listen(PORT, () => {
    console.log(`✅ Prod server running at http://localhost:${PORT}`);
  });
}