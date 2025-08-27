// server/index.ts
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import session from "express-session";
import connectPg from "connect-pg-simple";
import passport from "passport";

import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupLocalAuth } from "./localAuth";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set");
}

const app = express();

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple request logger (keeps your previous logging behavior)
app.use((req, res, next) => {
  const start = Date.now();
  const pathReq = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathReq.startsWith("/api")) {
      let logLine = `${req.method} ${pathReq} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

// === Sessions (Postgres store) ===
const PgSession = connectPg(session);
const store = new PgSession({
  conString: process.env.DATABASE_URL,
  createTableIfMissing: false, // you already have sessions table
  tableName: "sessions",
});

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  })
);

// Initialize passport AFTER session
app.use(passport.initialize());
app.use(passport.session());

// Mount local auth (passport strategy + routes)
setupLocalAuth(app);

// Mount other API routes (your existing)
(async () => {
  const server = await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    // rethrow for dev visibility
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "../client/dist/index.html"));
    });
  }

  const port = 5000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();