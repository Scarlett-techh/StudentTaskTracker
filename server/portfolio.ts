import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { storage } from "./storage";

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

// Get portfolio items
router.get("/api/portfolio", async (req, res) => {
  const items = await storage.getPortfolioItems();
  res.json(items);
});

// Upload portfolio items (allow multiple files)
router.post("/api/portfolio", upload.array("files"), async (req, res) => {
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
router.delete("/api/portfolio/:id", async (req, res) => {
  try {
    await storage.deletePortfolioItem(Number(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;