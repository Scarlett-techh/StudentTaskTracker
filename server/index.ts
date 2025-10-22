// server/index.ts
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { pool, db } from "./db";
import PgSession from "connect-pg-simple";
import moodRoutes from "./routes/mood";
import tasksRoutes from "./routes/tasks"; // ✅ ADDED: Import tasks routes
import { sessions } from "@shared/schema";

// Import your API routes
import userRoutes from "./api/user.js";
import accountRoutes from "./api/user/account.js";
import settingsRoutes from "./api/user/settings.js";
import authRoutes from "./routes/auth";

const app = express();

// Initialize PostgreSQL session store
const PgStore = PgSession(session);

// ✅ FIXED: Enhanced Session configuration
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "student-platform-secret-key-change-in-production-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // ✅ FIXED: Set to false for development (Replit uses HTTP)
      httpOnly: true, // ✅ ADDED: Prevent XSS attacks
      sameSite: "lax", // ✅ ADDED: CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: new PgStore({
      pool: pool,
      createTableIfMissing: true,
      tableName: "sessions",
    }),
  }),
);

// ✅ FIXED: Enhanced CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow requests from any origin in development
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Content-Length, X-CSRF-Token",
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ✅ FIXED: Better session debugging middleware
app.use((req, res, next) => {
  // Only log API requests to reduce noise
  if (req.path.startsWith("/api")) {
    console.log("🔐 [SESSION] Path:", req.path);
    console.log("🔐 [SESSION] Session ID:", req.sessionID);
    console.log(
      "🔐 [SESSION] User in session:",
      req.session?.user ? req.session.user.id : "No user",
    );
    console.log("🔐 [SESSION] Cookies present:", !!req.headers.cookie);
  }
  next();
});

app.use(express.json({ limit: "10mb" })); // ✅ ADDED: Increased limit for file uploads
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // ✅ FIXED: Set extended to true

// Check if sessions table exists and create if missing
async function ensureSessionsTable() {
  try {
    // This will throw if table doesn't exist, triggering the catch block
    await db.select().from(sessions).limit(1);
    console.log("✅ Sessions table exists");
  } catch (error) {
    console.log("⚠️ Sessions table might not exist, but continuing...");
  }
}

// ✅ FIXED: Authentication middleware for protected routes
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  console.log("🔐 [AUTH MIDDLEWARE] Checking auth for:", req.path);
  console.log("🔐 [AUTH MIDDLEWARE] Session user:", req.session.user);

  if (!req.session.user) {
    console.log("❌ [AUTH MIDDLEWARE] No user in session - returning 401");
    return res.status(401).json({
      error: "Unauthorized - Please log in again",
      code: "NO_SESSION",
    });
  }

  console.log("✅ [AUTH MIDDLEWARE] User authenticated:", req.session.user.id);
  next();
};

// ✅ FIXED: Add session check endpoint before auth middleware
app.get("/api/auth/session-check", (req, res) => {
  res.json({
    authenticated: !!req.session.user,
    user: req.session.user,
    sessionID: req.sessionID,
  });
});

// Add API routes with proper authentication
app.use("/api/user", userRoutes);
app.use("/api/user/account", accountRoutes);
app.use("/api/user/settings", settingsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/tasks", tasksRoutes); // ✅ ADDED: Register tasks routes

// ✅ ADDED: Debug endpoint to check if tasks routes are working
app.get("/api/tasks/debug-test", (req, res) => {
  console.log("🔐 [TASKS DEBUG] Session:", req.session);
  console.log("🔐 [TASKS DEBUG] User:", req.session.user);

  if (!req.session.user) {
    return res.status(401).json({
      error: "No user in session",
      sessionID: req.sessionID,
    });
  }

  res.json({
    authenticated: true,
    user: req.session.user,
    sessionID: req.sessionID,
    message:
      "Tasks routes are properly registered and authentication is working",
  });
});

// ✅ ADDED: Global error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ [GLOBAL ERROR]", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await ensureSessionsTable();

  const server = await registerRoutes(app);

  // ✅ FIXED: Enhanced error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("❌ [UNHANDLED ERROR]", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Don't throw the error again, just log it
    res.status(status).json({
      error: message,
      code: err.code || "UNKNOWN_ERROR",
    });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);

    // 👇 Catch-all: always return index.html for React routes
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "../client/dist/index.html"));
    });
  }

  // ✅ Use Replit's provided PORT, fallback to 5000
  const port = process.env.PORT ? Number(process.env.PORT) : 5000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`🚀 Server running on port ${port}`);
      log(
        `🔐 Session secret: ${process.env.SESSION_SECRET ? "Set" : "Using default"}`,
      );
      log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
      log(`✅ Registered routes: /api/auth, /api/user, /api/mood, /api/tasks`);
    },
  );
})();
