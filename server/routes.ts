import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertTaskSchema,
  insertNoteSchema,
  insertPhotoSchema,
  insertTaskAttachmentSchema,
  insertSubjectSchema,
  insertMoodEntrySchema,
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import { generateRecommendations } from "./recommendation-engine";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import passport from "passport";
import bcrypt from "bcryptjs";
import { isAuthenticated } from "./localAuth";

// Configure multer for disk storage
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = "./uploads";
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.originalname);
      cb(null, file.fieldname + "-" + uniqueSuffix + extension);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Debug middleware for file uploads
const logRequest = (req: any, res: any, next: any) => {
  console.log("Request body:", req.body);
  console.log("Request files:", req.files);
  console.log("Request file:", req.file);
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware
  function handleError(err: any, res: Response) {
    console.error("API Error:", err);

    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }

    res.status(500).json({ message: err.message || "Internal server error" });
  }

  // ===== AUTH ROUTES =====
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password, role } = req.body;

      if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, password, and role are required" });
      }

      // Check if user exists
      const existingUser = await storage.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate coachId if role is coach
      let coachId: string | null = null;
      if (role === "coach") {
        coachId = "COACH-" + uuidv4().split("-")[0].toUpperCase();
      }

      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        role,
        coachId,
      });

      // Auto login after signup
      req.login(newUser, (err) => {
        if (err) return res.status(500).json({ message: "Signup successful, but login failed" });
        return res.status(201).json({ message: "Signup successful", user: newUser });
      });
    } catch (err: any) {
      handleError(err, res);
    }
  });

  app.post("/api/auth/login", (req: Request, res: Response, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return res.status(500).json({ message: "Auth error" });
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        return res.json({ message: "Login successful", user });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ===== TASK ROUTES =====
  app.get("/api/tasks", isAuthenticated, async (req: any, res: Response) => {
    try {
      const tasks = await storage.getTasks(req.user.id);
      res.json(tasks);
    } catch (err: any) {
      handleError(err, res);
    }
  });

  // (⚡ Other task/note/photo routes unchanged)

  // ✅ At the very bottom
  const httpServer = createServer(app);
  return httpServer;
}
