// server/index.ts
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { pool, db } from "./db";
import PgSession from "connect-pg-simple";
import moodRoutes from "./routes/mood";
import tasksRoutes from "./routes/tasks";
import { sessions } from "@shared/schema";

// Import your API routes
import userRoutes from "./api/user.js";
import accountRoutes from "./api/user/account.js";
import settingsRoutes from "./api/user/settings.js";
import authRoutes from "./routes/auth";
import analyticsRoutes from "./routes/analytics";

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
      secure: process.env.NODE_ENV === "production", // ✅ FIXED: Secure in production
      httpOnly: true,
      sameSite: "lax",
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

// ✅ DEBUG: Add health check endpoints FIRST
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || "development",
    message: "Server is running"
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await db.select().from(sessions).limit(1);
    res.json({ 
      success: true, 
      message: "Database connected",
      data: result 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      note: "Check DATABASE_URL environment variable" 
    });
  }
});

app.get("/api/test-env", (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    hasSessionSecret: !!process.env.SESSION_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    port: process.env.PORT,
  });
});

// ✅ FIXED: Better session debugging middleware
app.use((req, res, next) => {
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

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Check if sessions table exists and create if missing
async function ensureSessionsTable() {
  try {
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
app.use("/api/analytics", analyticsRoutes);
app.use("/api/tasks", tasksRoutes);

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

// ✅ ADDED: Debug endpoint for analytics
app.get("/api/analytics/debug-test", requireAuth, (req: any, res) => {
  res.json({
    success: true,
    message: "Analytics routes are working",
    user: req.session.user,
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

// ✅ CRITICAL: Export for Vercel serverless functions
export default app;

// Only start server in development
if (process.env.NODE_ENV !== 'production') {
  (async () => {
    await ensureSessionsTable();

    const server = await registerRoutes(app);

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
      app.get("*", (_req, res) => {
        res.sendFile(path.resolve(__dirname, "../client/dist/index.html"));
      });
    }

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
      },
    );
  })();
}
