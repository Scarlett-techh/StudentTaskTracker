// server/routes.ts
import express, { type Express, type Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateAIAnalysis } from "./ai-analysis";
import { sendSharedWorkEmail } from "./email";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
// Add this import with the other imports at the top
import userRoutes from "./api/user.js";

// ✅ Import portfolio routes
import portfolioRoutes from "./routes/portfolio";
// ✅ Import share routes
import shareRoutes from "./routes/share.js"; // ADD THIS IMPORT

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images and PDF files are allowed"));
    }
  },
});

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
}

// Helper functions for skill calculations
function calculateCriticalThinkingScore(tasks: any[]) {
  const diverseSubjects = new Set(tasks.map((t: any) => t.subject)).size;
  const complexTasks = tasks.filter((t: any) => t.priority === "high").length;
  return Math.min(100, diverseSubjects * 15 + complexTasks * 5);
}

function calculateCreativityScore(tasks: any[]) {
  const creativeTasks = tasks.filter(
    (t: any) =>
      t.subject?.toLowerCase().includes("art") ||
      t.subject?.toLowerCase().includes("creative") ||
      t.type === "project",
  ).length;
  return Math.min(100, creativeTasks * 10);
}

function calculateCollaborationScore(user: any, tasks: any[]) {
  const sharedTasks = tasks.filter((t: any) => t.shared === true).length;
  const groupTasks = tasks.filter((t: any) => t.type === "group").length;
  return Math.min(100, sharedTasks * 10 + groupTasks * 15);
}

function calculateCommunicationScore(tasks: any[]) {
  const communicationTasks = tasks.filter(
    (t: any) =>
      t.type === "presentation" ||
      t.type === "writing" ||
      t.subject?.toLowerCase().includes("language"),
  ).length;
  return Math.min(100, communicationTasks * 8);
}

function calculateSelfDirectionScore(user: any, tasks: any[]) {
  const streakBonus = (user.streak || 0) * 2;
  const selfInitiated = tasks.filter(
    (t: any) => t.assignedBy === "self",
  ).length;
  return Math.min(100, streakBonus + selfInitiated * 8);
}

function calculateSocialEmotionalScore(user: any) {
  const streak = user.streak || 0;
  const moodScore = user.moodRating || 5;
  return Math.min(100, streak * 3 + moodScore * 5);
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
  // Traditional Registration Endpoint - UPDATED TO FIX DATABASE ISSUE
  // ========================
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, username, password, firstName, lastName, userType } =
        req.body;

      // Validate required fields
      if (!email || !username || !password || !firstName || !lastName) {
        return res.status(400).json({
          message:
            "Required fields: email, username, password, firstName, lastName",
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          message: "User with this email already exists",
        });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({
          message: "Username already taken",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user data - REMOVED dateOfBirth to fix database error
      const userData = {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        userType: userType || "student",
        name: `${firstName} ${lastName}`,
        points: 0,
        level: 1,
        streak: 0,
        // OAuth fields set to null for traditional users
        replitId: null,
        profileImageUrl: null,
        avatar: null,
      };

      console.log("Creating user with data:", {
        email,
        username,
        firstName,
        lastName,
      });

      // Create user
      const newUser = await storage.createUser(userData);

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;

      res.status(201).json({
        message: "User registered successfully",
        user: userWithoutPassword,
      });
    } catch (err: any) {
      console.error("Registration error:", err);

      // More specific error handling for database issues
      if (err.message && err.message.includes("date_of_birth")) {
        return res.status(500).json({
          message: "Database configuration error. Please contact support.",
        });
      }

      handleError(err, res);
    }
  });

  // ========================
  // Traditional Login Endpoint - ADDED THIS
  // ========================
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password are required",
        });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      // Check if user has a password (OAuth users might not have passwords)
      if (!user.password) {
        return res.status(401).json({
          message:
            "This account uses OAuth login. Please use Replit Auth to sign in.",
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      // For traditional auth, we'll use session-based authentication
      // You might want to implement JWT tokens here instead
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({
            message: "Login failed",
          });
        }

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.json({
          message: "Login successful",
          user: userWithoutPassword,
        });
      });
    } catch (err: any) {
      console.error("Login error:", err);
      handleError(err, res);
    }
  });

  // ========================
  // Mood Endpoints - FIXED THESE
  // ========================
  app.get("/api/user/mood/today", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);

      const todaysMood = await storage.getTodaysMood(user.id);
      res.json(todaysMood);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // FIXED: This endpoint should use the moodEntries table, not update user profile
  app.post("/api/user/mood", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);
      const { moodType, intensity, note } = req.body;

      if (!moodType || !intensity) {
        return res.status(400).json({
          message: "Mood type and intensity are required",
        });
      }

      // Use the proper moodEntries table instead of updating user profile
      const moodEntry = await storage.createMood({
        userId: user.id,
        moodType,
        intensity,
        note: note || null,
      });

      // Return success response
      res.json({
        success: true,
        message: "Mood shared successfully",
        mood: moodEntry,
      });
    } catch (err: any) {
      console.error("Error saving mood:", err);
      res.status(500).json({
        message: "Failed to save mood. Please try again.",
        code: "MOOD_CREATE_ERROR",
      });
    }
  });

  // ADD THIS: New endpoint for the frontend that's calling /mood (not /api/user/mood)
  app.post("/mood", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);
      const { moodType, intensity, note } = req.body;

      if (!moodType || !intensity) {
        return res.status(400).json({
          message: "Mood type and intensity are required",
        });
      }

      // Use the proper moodEntries table
      const moodEntry = await storage.createMood({
        userId: user.id,
        moodType,
        intensity,
        note: note || null,
      });

      // Return success response
      res.json({
        success: true,
        message: "Mood shared successfully",
        mood: moodEntry,
      });
    } catch (err: any) {
      console.error("Error saving mood:", err);
      res.status(500).json({
        message: "Failed to save mood. Please try again.",
        code: "MOOD_CREATE_ERROR",
      });
    }
  });

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
  // Task Creation Endpoint
  // ========================
  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);
      const taskData = req.body;

      // Add user ID to the task data
      taskData.userId = user.id;

      // Create the task
      const newTask = await storage.createTask(taskData);
      res.status(201).json(newTask);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // ========================
  // Task Update Endpoint (PUT)
  // ========================
  app.put("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);
      const taskId = parseInt(req.params.id);
      const taskData = req.body;

      // Verify the task belongs to the user
      const task = await storage.getTask(taskId);
      if (!task || task.userId !== user.id) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Update the task
      const updatedTask = await storage.updateTask(taskId, taskData);
      res.json(updatedTask);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // ========================
  // Task Update Endpoint (PATCH) - For partial updates
  // ========================
  app.patch("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);
      const taskId = parseInt(req.params.id);
      const taskData = req.body;

      // Verify the task belongs to the user
      const task = await storage.getTask(taskId);
      if (!task || task.userId !== user.id) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Update the task
      const updatedTask = await storage.updateTask(taskId, taskData);
      res.json(updatedTask);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // ========================
  // Task Deletion Endpoint
  // ========================
  app.delete("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);
      const taskId = parseInt(req.params.id);

      // Verify the task belongs to the user
      const task = await storage.getTask(taskId);
      if (!task || task.userId !== user.id) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Delete the task
      await storage.deleteTask(taskId);
      res.status(204).send();
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // ========================
  // Task Reorder Endpoint (for drag-and-drop)
  // ========================
  app.patch("/api/tasks/reorder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);
      const { tasks } = req.body;

      // Update task orders
      for (const taskUpdate of tasks) {
        const task = await storage.getTask(taskUpdate.id);
        if (task && task.userId === user.id) {
          await storage.updateTask(taskUpdate.id, { order: taskUpdate.order });
        }
      }

      res.status(200).json({ message: "Tasks reordered successfully" });
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // ========================
  // File Upload Endpoint for Proof/Attachments - SIMPLIFIED VERSION
  // ========================
  app.post(
    "/api/upload",
    isAuthenticated,
    upload.single("file"),
    async (req: any, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        // Generate a public URL for the uploaded file
        const fileUrl = `/uploads/${req.file.filename}`;

        // Return file info without storing in database
        res.json({
          url: fileUrl,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
        });
      } catch (err: any) {
        handleError(err, res);
      }
    },
  );

  // ========================
  // Serve uploaded files
  // ========================
  app.use("/uploads", isAuthenticated, express.static("uploads"));

  // ========================
  // User Stats Endpoint for Analytics
  // ========================
  app.get("/api/user-stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);

      // Get task statistics
      const tasks = await storage.getTasks(user.id);
      const completedTasks = tasks.filter(
        (task: any) => task.status === "completed",
      );

      res.json({
        level: user.level || 1,
        points: user.points || 0,
        streak: user.streak || 0,
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
      });
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // ========================
  // Subjects Endpoint for Analytics
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
  // AI Learning Analysis Endpoint (Simplified)
  // ========================
  app.get(
    "/api/ai-learning-analysis",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUserByReplitId(userId);
        const tasks = await storage.getTasks(user.id);
        const completedTasks = tasks.filter(
          (task: any) => task.status === "completed",
        );

        // Simple analysis without external dependency
        const analysis = {
          analysis: `Based on your learning patterns, you've completed ${completedTasks.length} out of ${tasks.length} tasks. ${completedTasks.length > 5 ? "Great job maintaining consistency!" : "Keep going to build momentum!"}`,
          strengths: ["Task completion", "Learning engagement"],
          recommendations: [
            "Try to complete at least one task daily",
            "Explore different subject areas",
          ],
          achievements: [
            `Completed ${completedTasks.length} tasks`,
            `${user.streak || 0}-day streak`,
          ],
          learningStyle: "Developing learning style",
        };

        res.json(analysis);
      } catch (err: any) {
        handleError(err, res);
      }
    },
  );

  // ========================
  // Skill Metrics Endpoint
  // ========================
  app.get("/api/skill-metrics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);
      const tasks = await storage.getTasks(user.id);
      const completedTasks = tasks.filter(
        (task: any) => task.status === "completed",
      );

      // Calculate skill metrics based on actual behavior
      const metrics = {
        criticalThinking: calculateCriticalThinkingScore(completedTasks),
        creativity: calculateCreativityScore(completedTasks),
        collaboration: calculateCollaborationScore(user, tasks),
        communication: calculateCommunicationScore(completedTasks),
        selfDirection: calculateSelfDirectionScore(user, completedTasks),
        socialEmotional: calculateSocialEmotionalScore(user),
      };

      res.json(metrics);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // ========================
  // REMOVED: Duplicate /api/share/work endpoint - using the one from shareRoutes instead
  // ========================

  // ========================
  // ✅ Portfolio routes (use the imported router)
  // ========================
  app.use("/api/portfolio", portfolioRoutes);
  // Add this with your other route mounts (around line 400+)
  app.use("/api/user", userRoutes);
  // ========================
  // ✅ Share routes (use the imported router) - ADD THIS
  // ========================
  app.use("/api/share", shareRoutes);

  // ========================
  // Create HTTP server
  // ========================
  const httpServer = createServer(app);
  return httpServer;
}
