import express, { type Request, Response } from "express";
import { registerRoutes } from "./routes";
import { log } from "./vite";
import path from "path";

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the dist directory
const distPath = path.resolve(__dirname, "../client/dist");
app.use(express.static(distPath));

// Serve index.js for client-side requests that aren't matched by other routes
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.resolve(distPath, "index.js"));
});

// Start the server
const port = process.env.PORT ? Number(process.env.PORT) : 5000;
const server = app.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
  log(`Server is running on http://0.0.0.0:${port}`);
});

// Register routes
(async () => {
  await registerRoutes(app);
})();