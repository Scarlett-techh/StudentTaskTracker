// server/routes.ts
import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateAIAnalysis } from "./ai-analysis"; // Import the AI analysis function
import { db } from "./db"; // Add this import
import { sql } from "drizzle-orm"; // Add this import

// ✅ Import feature routes (default export)
import portfolioRoutes from "./routes/portfolio";

// Helper functions for skill calculations
function calculateCriticalThinkingScore(tasks: any[]) {
  // Base score on complexity/diversity of completed tasks
  const diverseSubjects = new Set(tasks.map((t: any) => t.subject)).size;
  const complexTasks = tasks.filter((t: any) => t.priority === 'high').length;
  return Math.min(100, (diverseSubjects * 15) + (complexTasks * 5));
}

function calculateCreativityScore(tasks: any[]) {
  // Base on creative tasks (like projects, art, etc.)
  const creativeTasks = tasks.filter((t: any) => 
    t.subject?.toLowerCase().includes('art') || 
    t.subject?.toLowerCase().includes('creative') ||
    t.type === 'project'
  ).length;
  return Math.min(100, creativeTasks * 10);
}

function calculateCollaborationScore(user: any, tasks: any[]) {
  // Base on shared tasks or group activities
  const sharedTasks = tasks.filter((t: any) => t.shared === true).length;
  const groupTasks = tasks.filter((t: any) => t.type === 'group').length;
  return Math.min(100, (sharedTasks * 10) + (groupTasks * 15));
}

function calculateCommunicationScore(tasks: any[]) {
  // Base on tasks that involve communication (presentations, writing, etc.)
  const communicationTasks = tasks.filter((t: any) => 
    t.type === 'presentation' || 
    t.type === 'writing' ||
    t.subject?.toLowerCase().includes('language')
  ).length;
  return Math.min(100, communicationTasks * 8);
}

function calculateSelfDirectionScore(user: any, tasks: any[]) {
  // Base on consistency and independent work
  const streakBonus = (user.streak || 0) * 2;
  const selfInitiated = tasks.filter((t: any) => t.assignedBy === 'self').length;
  return Math.min(100, streakBonus + (selfInitiated * 8));
}

function calculateSocialEmotionalScore(user: any) {
  // Base on user engagement and consistency
  const streak = user.streak || 0;
  const moodScore = user.moodRating || 5; // Assuming 1-10 scale
  return Math.min(100, (streak * 3) + (moodScore * 5));
}

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

  // POST endpoint for creating tasks
  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      console.log("Creating task with data:", req.body);

      const userId = req.user.claims.sub;
      console.log("User ID from token:", userId);

      const user = await storage.getUserByReplitId(userId);
      console.log("Found user:", user);

      if (!user) {
        console.error("User not found for replitId:", userId);
        return res.status(404).json({ message: "User not found" });
      }

      const taskData = {
        ...req.body,
        userId: user.id,
      };

      console.log("Creating task with data:", taskData);
      const task = await storage.createTask(taskData);
      console.log("Task created successfully:", task);

      res.status(201).json(task);
    } catch (err: any) {
      console.error("Error creating task:", err);
      handleError(err, res);
    }
  });

  // PATCH endpoint for updating tasks
  app.patch("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);
      const taskId = parseInt(req.params.id);
      const updates = req.body;

      // Verify the task belongs to the user
      const task = await storage.getTask(taskId);
      if (!task || task.userId !== user.id) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Update the task
      const updatedTask = await storage.updateTask(taskId, updates);
      res.json(updatedTask);
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
  // NEW: AI Learning Analysis Endpoint
  // ========================
  app.get("/api/ai-learning-analysis", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);
      const tasks = await storage.getTasks(user.id);
      const completedTasks = tasks.filter((task: any) => task.status === 'completed');

      // Simple analysis without external dependency
      const analysis = {
        analysis: `Based on your learning patterns, you've completed ${completedTasks.length} out of ${tasks.length} tasks. ${completedTasks.length > 5 ? "Great job maintaining consistency!" : "Keep going to build momentum!"}`,
        strengths: ["Task completion", "Learning engagement"],
        recommendations: ["Try to complete at least one task daily", "Explore different subject areas"],
        achievements: [`Completed ${completedTasks.length} tasks`, `${user.streak || 0}-day streak`],
        learningStyle: "Developing learning style"
      };

      res.json(analysis);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // ========================
  // Health check endpoint
  // ========================
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection
      const result = await db.execute(sql`SELECT 1 as test`);
      console.log("Database connection test result:", result);
      res.json({ status: "OK", database: "Connected" });
    } catch (error: any) {
      console.error("Database connection test failed:", error);
      res.status(500).json({ status: "Error", database: "Connection failed", error: error.message });
    }
  });

  // ========================
  // NEW: Skill Metrics Endpoint
  // ========================
  app.get("/api/skill-metrics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);
      const tasks = await storage.getTasks(user.id);
      const completedTasks = tasks.filter((task: any) => task.status === 'completed');

      // Calculate skill metrics based on actual behavior
      const metrics = {
        criticalThinking: calculateCriticalThinkingScore(completedTasks),
        creativity: calculateCreativityScore(completedTasks),
        collaboration: calculateCollaborationScore(user, tasks),
        communication: calculateCommunicationScore(completedTasks),
        selfDirection: calculateSelfDirectionScore(user, completedTasks),
        socialEmotional: calculateSocialEmotionalScore(user)
      };

      res.json(metrics);
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