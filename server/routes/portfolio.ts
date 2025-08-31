import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { storage } from "../storage";

const router = express.Router();

// ✅ Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../../uploads/portfolio");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage setup
const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storageConfig,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// ========================
// Portfolio Routes
// ========================

// Get portfolio items
router.get("/api/portfolio", async (req, res) => {
  try {
    console.log("Fetching portfolio items");
    // TODO: Get user ID from authenticated user - for now use hardcoded
    const userId = 1; // req.user?.id - need to implement proper user ID extraction
    const items = await storage.getPortfolioItems(userId);
    res.json(items);
  } catch (error: any) {
    console.error("Error fetching portfolio items:", error);
    res.status(500).json({ message: error.message });
  }
});

// Upload portfolio items
router.post("/api/portfolio", upload.single("file"), async (req, res) => {
  try {
    console.log("Uploading portfolio item:", req.body);

    // TODO: Get user ID from authenticated user - for now use hardcoded
    const userId = 1; // req.user?.id - need to implement proper user ID extraction

    const file = req.file as Express.Multer.File;
    const { title, description, subject, type, link } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // Handle file uploads
    if ((type === "file" || type === "photo") && file) {
      const savedItem = await storage.createPortfolioItem({
        userId,
        title: title || file.originalname,
        description: description || null,
        subject: subject || null,
        type: type || "file",
        filePath: file.path,
        link: null,
        score: null,
        sourceId: null,
        featured: false,
      });
      res.json(savedItem);
    } else if (type === "link") {
      // Handle link items
      if (!link) {
        return res.status(400).json({ message: "Link is required for link type" });
      }

      const savedItem = await storage.createPortfolioItem({
        userId,
        title,
        description: description || null,
        subject: subject || null,
        type: "link",
        link: link,
        filePath: null,
        score: null,
        sourceId: null,
        featured: false,
      });
      res.json(savedItem);
    } else {
      return res.status(400).json({ message: "File is required for file/photo type" });
    }
  } catch (error: any) {
    console.error("Error adding portfolio item:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete portfolio item
router.delete("/api/portfolio/:id", async (req, res) => {
  try {
    console.log("Deleting portfolio item:", req.params.id);
    await storage.deletePortfolioItem(Number(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting portfolio item:", error);
    res.status(500).json({ message: error.message });
  }
});

// Serve portfolio files
router.get("/api/portfolio/file/:id", async (req, res) => {
  try {
    console.log("Serving portfolio file:", req.params.id);
    const item = await storage.getPortfolioItem(Number(req.params.id));

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (!item.filePath || !fs.existsSync(item.filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.sendFile(path.resolve(item.filePath));
  } catch (error: any) {
    console.error("Error serving portfolio file:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;