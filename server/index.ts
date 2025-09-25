// server/index.ts
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { isAuthenticated } from "./replitAuth.ts";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

// Import your API routes - Use correct extensions and paths
import shareRoutes from "./routes/share.ts";

// Add API routes before the logging middleware - Let routes.ts handle most routing
app.use("/api/share", shareRoutes);

// DIRECT ROUTE FOR TESTING - Add this before the other middleware
app.post("/api/share/send-to-coach", isAuthenticated, async (req: any, res) => {
  try {
    console.log("🔥 DIRECT SHARE ENDPOINT HIT:", req.body);

    const { coachEmail, message, items, totalItems } = req.body;

    if (!coachEmail) {
      return res.status(400).json({ message: "Coach email is required" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(coachEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    console.log("✅ Valid share request:", {
      coachEmail,
      itemCount: totalItems,
      hasMessage: !!message,
    });

    // Simulate email sending (for testing)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    res.json({
      success: true,
      message: `Successfully shared ${totalItems} items with ${coachEmail}`,
      data: {
        coachEmail,
        itemsShared: totalItems,
        message: message || "No custom message",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ Error in direct share endpoint:", error);
    res.status(500).json({
      message: error.message || "Server error",
      debug: "This is the direct route in server/index.ts",
    });
  }
});

// Add CORS middleware for development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Enhanced request logging middleware
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

      // Log API errors more clearly
      if (res.statusCode >= 400) {
        logLine = `🚨 ERROR: ${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          console.error("API Error Response:", capturedJsonResponse);
        }
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Health check endpoint with route information
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    mountedRoutes: [
      "/api/user",
      "/api/tasks",
      "/api/share",
      "/api/portfolio",
      "/api/files",
    ],
    shareEndpoints: [
      "POST /api/tasks/:id/share",
      "POST /api/share/send-to-coach",
      "GET /api/share/stats",
    ],
    directRoute: "✅ Direct route active in server/index.ts",
  });
});

// Email service status check
app.get("/api/email-status", (req, res) => {
  const hasApiKey = !!process.env.MAILERSEND_API_KEY;
  res.json({
    emailService: "MailerSend",
    configured: hasApiKey,
    status: hasApiKey ? "Configured" : "Missing API Key",
    fromAddress: "no-reply@trial-3zqvy16mr9kl5z13.mlsender.net",
  });
});

// Test route for share functionality
app.get("/api/test-share", (req, res) => {
  res.json({
    message: "Share routes are mounted correctly",
    endpoints: {
      shareTask: "POST /api/tasks/:taskId/share",
      shareToCoach: "POST /api/share/send-to-coach",
      shareStats: "GET /api/share/stats",
      test: "GET /api/test-share",
      directTest: "POST /api/share/send-to-coach (direct route)",
    },
    timestamp: new Date().toISOString(),
    note: "Check server console for '🔥 DIRECT SHARE ENDPOINT HIT' when testing",
  });
});

// Test the specific share endpoint
app.post("/api/share/test-endpoint", (req, res) => {
  console.log("Test share endpoint hit:", req.body);
  res.json({
    success: true,
    message: "Share endpoint is working",
    received: req.body,
    routeType: "Direct route in server/index.ts",
  });
});

// Route to test if share.ts file is being loaded
app.get("/api/share/debug", async (req, res) => {
  try {
    // Try to import the share routes dynamically to see if they exist
    const shareModule = await import("./routes/share.ts");
    res.json({
      status: "Share route file exists",
      module: shareModule ? "Loaded successfully" : "Failed to load",
      defaultExport: shareModule.default ? "Present" : "Missing",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.json({
      status: "Share route file error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

(async () => {
  const server = await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the full error for debugging
    console.error("Server error:", err);

    res.status(status).json({
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  });

  // Enhanced 404 handler for API routes
  app.use("/api/*", (req, res) => {
    console.error(`API endpoint not found: ${req.method} ${req.originalUrl}`);
    console.log("Available endpoints:", [
      "GET /api/user",
      "POST /api/tasks/:id/share",
      "POST /api/share/send-to-coach",
      "GET /api/share/stats",
      "GET /api/test-share",
      "GET /api/email-status",
      "GET /health",
      "GET /api/share/debug",
    ]);

    res.status(404).json({
      message: "API endpoint not found",
      requestedPath: req.path,
      method: req.method,
      availableEndpoints: [
        "GET /api/user",
        "POST /api/tasks/:id/share",
        "POST /api/share/send-to-coach (DIRECT ROUTE)",
        "GET /api/share/stats",
        "GET /api/test-share",
        "GET /api/email-status",
        "GET /health",
        "GET /api/share/debug",
      ],
      debug: "Try the direct route at POST /api/share/send-to-coach",
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

  // Log server startup information
  log(`Starting server on port ${port}`);
  log(`Environment: ${process.env.NODE_ENV || "development"}`);
  log(
    `Email service: ${process.env.MAILERSEND_API_KEY ? "Configured" : "Not configured"}`,
  );
  log(
    `Mounted API routes: /api/user, /api/tasks, /api/share, /api/portfolio, /api/files`,
  );
  log(`🔥 DIRECT SHARE ROUTE ACTIVE: POST /api/share/send-to-coach`);

  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`Server running on port ${port}`);
      log(`Health check: http://localhost:${port}/health`);
      log(`Email status: http://localhost:${port}/api/email-status`);
      log(`Share test: http://localhost:${port}/api/test-share`);
      log(`Share debug: http://localhost:${port}/api/share/debug`);
      log(
        `Share endpoint test: POST http://localhost:${port}/api/share/test-endpoint`,
      );
      log(
        `🔥 DIRECT SHARE ENDPOINT: POST http://localhost:${port}/api/share/send-to-coach`,
      );
    },
  );
})();
