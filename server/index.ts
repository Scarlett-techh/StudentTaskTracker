import express from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { setupLocalAuth } from "./localAuth.js";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic } from "./vite.js";

const app = express();

// ===== Middleware =====
app.use(express.json());

// ✅ Configure session middleware BEFORE passport
const PgStore = connectPg(session);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret", // 🔐 Replace with strong secret in production
    resave: false,
    saveUninitialized: false,
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true, // ✅ Auto-create the "session" table if missing
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ✅ Only secure in production (HTTPS)
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  })
);

// ===== Auth (passport setup) =====
setupLocalAuth(app);

// ===== API routes =====
await registerRoutes(app);

// Debugging helper (to test sessions)
app.get("/api/debug/session", (req, res) => {
  res.json({
    session: req.session,
    user: req.user || null,
  });
});

const PORT = process.env.PORT || 3000;

// ===== Serve frontend =====
if (process.env.NODE_ENV === "development") {
  await setupVite(app);
  app.listen(PORT, () => {
    console.log(`✅ Dev server running at http://localhost:${PORT}`);
  });
} else {
  serveStatic(app);
  app.listen(PORT, () => {
    console.log(`✅ Prod server running at http://localhost:${PORT}`);
  });
}