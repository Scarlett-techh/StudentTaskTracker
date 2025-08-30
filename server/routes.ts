import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth, isAuthenticated } from "./replitAuth";

// ✅ Import feature routes
import { registerPortfolioRoutes } from "./routes/portfolio";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Error handling helper
  function handleError(err: any, res: Response) {
    console.error("API Error:", err);
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    res.status(500).json({ message: err.message || "Internal server error" });
  }

  // ========================
  // Auth routes
  // ========================
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ========================
  // Task Routes (example only, keep others too)
  // ========================
  app.get("/api/tasks", async (req, res) => {
    try {
      const userId = 1; // TODO: replace with real auth
      const tasks = await storage.getTasks(userId);
      res.json(tasks);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // ========================
  // ✅ Portfolio routes (modularized)
  // ========================
  registerPortfolioRoutes(app);

  // ========================
  // Create HTTP server
  // ========================
  const httpServer = createServer(app);
  return httpServer;
}