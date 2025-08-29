import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs"; // switched to bcryptjs for consistency
import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage.js";
import { v4 as uuidv4 } from "uuid";

export function setupLocalAuth(app: Express) {
  // ✅ Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // ===== Local Strategy =====
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email: string, password: string, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) return done(null, false, { message: "Invalid email or password" });

          const isMatch = await bcrypt.compare(password, user.password_hash);
          if (!isMatch) return done(null, false, { message: "Invalid email or password" });

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(Number(id));
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });

  // ===== AUTH ROUTES =====

  // Signup (student or coach)
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password, role, firstName, lastName } = req.body;

      if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, password, and role are required" });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Generate coachId if role is coach
      let coachId: string | null = null;
      if (role === "coach") {
        coachId = "COACH-" + uuidv4().split("-")[0].toUpperCase();
      }

      const newUser = await storage.createUser({
        email,
        password_hash,
        firstName,
        lastName,
        role,
        coachId,
      });

      // Auto-login after signup
      req.login(newUser, (err) => {
        if (err) {
          console.error("Auto-login after signup failed:", err);
          return res.status(201).json({ message: "User created, please log in", user: newUser });
        }
        return res.status(201).json({ message: "User created and logged in", user: newUser });
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login
  app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Unauthorized" });

      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.json({ message: "Logged in successfully", user });
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.json({ message: "Logged out" });
      });
    });
  });
}

// Middleware for protecting routes
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}
