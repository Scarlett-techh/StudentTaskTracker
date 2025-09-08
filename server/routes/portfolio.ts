import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { storage } from "../storage.js";
import { isAuthenticated } from "../replitAuth.js";

const router = express.Router();

// ✅ Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../../uploads/portfolio");

// Multer storage setup
const upload = multer({ dest: uploadDir });

// ========================
// Portfolio Routes
// ========================

// Get portfolio items for authenticated user
router.get("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUserByReplitId(userId);
    const items = await storage.getPortfolioItems(user.id);
    res.json(items || []);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new portfolio item
router.post("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUserByReplitId(userId);
    const portfolioData = req.body;

    // Add user ID to the portfolio data
    portfolioData.userId = user.id;

    // Create the portfolio item
    const newItem = await storage.createPortfolioItem(portfolioData);
    res.status(201).json(newItem);
  } catch (error: any) {
    console.error("Error creating portfolio item:", error);
    res.status(500).json({ message: error.message || "Failed to create portfolio item" });
  }
});

// Upload portfolio files
router.post("/upload", isAuthenticated, upload.array("files"), async (req: any, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const savedItems = await Promise.all(
      files.map(file =>
        storage.addPortfolioItem({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
        })
      )
    );
    res.json(savedItems);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete portfolio item
router.delete("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUserByReplitId(userId);
    const itemId = Number(req.params.id);

    // Verify the portfolio item belongs to the user
    const item = await storage.getPortfolioItem(itemId);
    if (!item || item.userId !== user.id) {
      return res.status(404).json({ message: "Portfolio item not found" });
    }

    await storage.deletePortfolioItem(itemId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;