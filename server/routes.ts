// server/routes.ts
import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth, isAuthenticated } from "./replitAuth";

// ✅ Import feature routes (default export)
import portfolioRoutes from "./routes/portfolio";

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
  // Task Routes - UPDATED WITH AUTH
  // ========================
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);
      const tasks = await storage.getTasks(user.id);
      res.json(tasks);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // ========================
  // NEW: User Stats Endpoint for Analytics
  // ========================
  app.get("/api/user-stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);

      // Get task statistics
      const tasks = await storage.getTasks(user.id);
      const completedTasks = tasks.filter((task: any) => task.status === 'completed');

      res.json({
        level: user.level || 1,
        points: user.points || 0,
        streak: user.streak || 0,
        totalTasks: tasks.length,
        completedTasks: completedTasks.length
      });
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // ========================
  // NEW: Subjects Endpoint for Analytics
  // ========================
  app.get("/api/subjects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);
      const tasks = await storage.getTasks(user.id);

      // Extract unique subjects from tasks
      const subjectsMap = new Map();
      tasks.forEach((task: any) => {
        if (task.subject && !subjectsMap.has(task.subject)) {
          subjectsMap.set(task.subject, { name: task.subject });
        }
      });

      const subjects = Array.from(subjectsMap.values());
      res.json(subjects);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // ========================
  // ✅ Portfolio routes (use default export router)
  // ========================
  app.use(portfolioRoutes);

  // ========================
  // Create HTTP server
  // ========================
  const httpServer = createServer(app);
  return httpServer;
}