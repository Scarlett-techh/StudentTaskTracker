// server/routes/portfolio.ts (updated)
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { storage } from "../storage.js";
import { isAuthenticated } from "../replitAuth.js";
import { db } from "../db.js"; // Import the database connection

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

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get portfolio items for the user
    const items = await storage.getPortfolioItems(user.id);
    res.json(items || []);
  } catch (error: any) {
    console.error("Error fetching portfolio items:", error);
    res.status(500).json({ message: error.message || "Failed to fetch portfolio items" });
  }
});

// Create a new portfolio item from a task
router.post("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUserByReplitId(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const portfolioData = req.body;

    // Add user ID to the portfolio data
    portfolioData.userId = user.id;

    // Create the portfolio item
    const newItem = await storage.createPortfolioItem(portfolioData);

    if (!newItem) {
      return res.status(500).json({ message: "Failed to create portfolio item" });
    }

    res.status(201).json(newItem);
  } catch (error: any) {
    console.error("Error creating portfolio item:", error);
    res.status(500).json({ message: error.message || "Failed to create portfolio item" });
  }
});

// Share task to portfolio with all proof types
router.post("/share-task", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUserByReplitId(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { taskId, portfolioIds, includeProof, proofFiles, proofText, proofLink } = req.body;

    // Get task details
    const task = await db.query.tasks.findFirst({
      where: (tasks: any, { eq }: any) => eq(tasks.id, taskId),
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Create portfolio items for each selected portfolio
    const results = [];
    for (const portfolioId of portfolioIds) {
      const portfolioData = {
        userId: user.id,
        title: task.title,
        description: task.description,
        type: 'task',
        subject: task.subject,
        category: task.category,
        sourceId: taskId,
        // Include all proof types if requested
        proofFiles: includeProof ? proofFiles || [] : [],
        proofText: includeProof ? proofText || '' : '',
        proofLink: includeProof ? proofLink || '' : '',
        // For backward compatibility, also populate attachments with files
        attachments: includeProof ? proofFiles || [] : [],
      };

      // Create the portfolio item
      const newItem = await storage.createPortfolioItem(portfolioData);
      results.push(newItem);
    }

    res.status(201).json({ success: true, items: results });
  } catch (error: any) {
    console.error("Error sharing task to portfolio:", error);
    res.status(500).json({ message: error.message || "Failed to share task to portfolio" });
  }
});

// Upload portfolio items (allow multiple files)
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

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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