// server/index.ts
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { pool, db } from "./db";
import PgSession from "connect-pg-simple";
import { sessions } from "@shared/schema";

// Import your API routes
import userRoutes from "./api/user.js";
import accountRoutes from "./api/user/account.js";
import settingsRoutes from "./api/user/settings.js";
import authRoutes from "./routes/auth";

const app = express();

// Initialize PostgreSQL session store
const PgStore = PgSession(session);

// Session configuration
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: new PgStore({
      pool: pool,
      createTableIfMissing: true,
      tableName: "sessions",
    }),
  }),
);

// CORS configuration
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Debug middleware for sessions
app.use((req, res, next) => {
  console.log("=== SESSION DEBUG ===");
  console.log("Session ID:", req.sessionID);
  console.log("Session data:", req.session);
  console.log("Session user:", req.session?.user);
  console.log("Cookies:", req.headers.cookie);
  console.log("=== END SESSION DEBUG ===");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Check if sessions table exists and create if missing
async function ensureSessionsTable() {
  try {
    // This will throw if table doesn't exist, triggering the catch block
    await db.select().from(sessions).limit(1);
    console.log("Sessions table exists");
  } catch (error) {
    console.log("Sessions table might not exist, but continuing...");
  }
}

// Add API routes before the logging middleware
app.use("/api/user", userRoutes);
app.use("/api/user/account", accountRoutes);
app.use("/api/user/settings", settingsRoutes);
app.use("/api/auth", authRoutes);

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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
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
      log(`serving on port ${port}`);
    },
  );
})();
