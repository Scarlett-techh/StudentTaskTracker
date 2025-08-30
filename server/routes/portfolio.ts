import type { Express, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { storage } from "../storage";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Debug middleware
const logRequest = (req: any, res: any, next: any) => {
  console.log("Request body:", req.body);
  console.log("Request files:", req.files);
  console.log("Request file:", req.file);
  next();
};

// Export a function to register portfolio routes
export function registerPortfolioRoutes(app: Express) {

  // Get all portfolio items for logged-in student (mock user ID)
  app.get("/api/portfolio", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Mock user ID for demo
      const portfolioItems = await storage.getPortfolioItems(userId);
      res.json(portfolioItems);
    } catch (err: any) {
      console.error("Portfolio fetch error:", err);
      res.status(500).json({ message: err.message || "Internal server error" });
    }
  });

  // Serve uploaded file/photo
  app.get("/api/portfolio/file/:id", async (req: Request, res: Response) => {
    try {
      const portfolioId = parseInt(req.params.id);
      const item = await storage.getPortfolioItem(portfolioId);

      if (!item || !item.filePath) {
        return res.status(404).json({ message: "File not found" });
      }

      const fullPath = path.resolve(item.filePath);

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }

      res.sendFile(fullPath);
    } catch (err: any) {
      console.error("File serve error:", err);
      res.status(500).json({ message: err.message || "Internal server error" });
    }
  });

  // Save new portfolio item (file, photo, or link)
  app.post("/api/portfolio", logRequest, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const userId = 1; // Mock user ID for demo

      let portfolioData = {
        title: req.body.title,
        description: req.body.description || null,
        subject: req.body.subject || null,
        type: req.body.type,
        userId,
        link: req.body.link || null,
        filePath: null as string | null,
        score: null as string | null,
        sourceId: null as number | null,
        featured: false
      };

      // Handle file upload
      if (req.file) {
        portfolioData.filePath = req.file.path;
        console.log("File uploaded:", req.file.path);
      }

      console.log("Creating portfolio item:", portfolioData);
      const portfolioItem = await storage.createPortfolioItem(portfolioData);
      console.log("Created portfolio item:", portfolioItem);
      res.status(201).json(portfolioItem);
    } catch (err: any) {
      console.error("Portfolio creation error:", err);
      res.status(500).json({ message: err.message || "Internal server error" });
    }
  });

  // Update portfolio item
  app.patch("/api/portfolio/:id", async (req: Request, res: Response) => {
    try {
      const portfolioId = parseInt(req.params.id);
      const updatedItem = await storage.updatePortfolioItem(portfolioId, req.body);

      if (!updatedItem) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }

      res.json(updatedItem);
    } catch (err: any) {
      console.error("Portfolio update error:", err);
      res.status(500).json({ message: err.message || "Internal server error" });
    }
  });

  // Delete portfolio item
  app.delete("/api/portfolio/:id", async (req: Request, res: Response) => {
    try {
      const portfolioId = parseInt(req.params.id);
      const deleted = await storage.deletePortfolioItem(portfolioId);

      if (!deleted) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }

      res.json({ message: "Portfolio item deleted successfully" });
    } catch (err: any) {
      console.error("Portfolio deletion error:", err);
      res.status(500).json({ message: err.message || "Internal server error" });
    }
  });

}