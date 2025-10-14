// server/index.ts
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { pool } from "./db";
import { sessions } from "@shared/schema";
import { sql } from "drizzle-orm";

// Import your API routes
import userRoutes from "./api/user.js";
import accountRoutes from "./api/user/account.js";
import settingsRoutes from "./api/user/settings.js";
import authRoutes from "./routes/auth"; // NEW IMPORT

const app = express();

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
    store: {
      // Simple in-memory store for development
      // In production, use a proper store like connect-pg-simple
      set: (sid, sess, callback) => {
        // Store session in database
        pool
          .query(
            "INSERT INTO sessions (sid, sess, expire) VALUES ($1, $2, $3) ON CONFLICT (sid) DO UPDATE SET sess = $2, expire = $3",
            [sid, sess, new Date(Date.now() + 24 * 60 * 60 * 1000)],
          )
          .then(() => callback())
          .catch(callback);
      },
      get: (sid, callback) => {
        pool
          .query(
            "SELECT sess FROM sessions WHERE sid = $1 AND expire > NOW()",
            [sid],
          )
          .then((result) => {
            callback(null, result.rows[0]?.sess || null);
          })
          .catch(callback);
      },
      destroy: (sid, callback) => {
        pool
          .query("DELETE FROM sessions WHERE sid = $1", [sid])
          .then(() => callback())
          .catch(callback);
      },
    } as any,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add API routes before the logging middleware
app.use("/api/user", userRoutes);
app.use("/api/user/account", accountRoutes);
app.use("/api/user/settings", settingsRoutes);
app.use("/api/auth", authRoutes); // NEW AUTH ROUTES

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
