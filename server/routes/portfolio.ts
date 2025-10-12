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
const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

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
    res
      .status(500)
      .json({ message: error.message || "Failed to fetch portfolio items" });
  }
});

// Create a new portfolio item (for manual uploads)
router.post(
  "/upload",
  isAuthenticated,
  upload.array("files"),
  async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { title, description, subject, type, link } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      const savedItems = [];

      // Handle multiple files
      if (files && files.length > 0) {
        for (const file of files) {
          const portfolioData = {
            userId: user.id,
            title:
              files.length > 1
                ? `${title} (${files.indexOf(file) + 1})`
                : title,
            description,
            subject,
            type,
            filePath: file.path,
            link: type === "link" ? link : null,
            attachments: [
              {
                filename: file.originalname,
                path: file.path,
                mimetype: file.mimetype,
                size: file.size,
              },
            ],
          };

          const newItem = await storage.createPortfolioItem(portfolioData);
          savedItems.push(newItem);
        }
      } else if (type === "link") {
        // Handle link type items
        const portfolioData = {
          userId: user.id,
          title,
          description,
          subject,
          type: "link",
          link,
          attachments: [],
        };

        const newItem = await storage.createPortfolioItem(portfolioData);
        savedItems.push(newItem);
      } else {
        return res
          .status(400)
          .json({ message: "Files are required for file/photo types" });
      }

      res.status(201).json(savedItems);
    } catch (error: any) {
      console.error("Error creating portfolio item:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to create portfolio item" });
    }
  },
);

// Create portfolio item from form data (alternative endpoint)
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
      return res
        .status(500)
        .json({ message: "Failed to create portfolio item" });
    }

    res.status(201).json(newItem);
  } catch (error: any) {
    console.error("Error creating portfolio item:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to create portfolio item" });
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

    const {
      taskId,
      portfolioIds,
      includeProof,
      proofFiles,
      proofText,
      proofLink,
    } = req.body;

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
        type: "task",
        subject: task.subject,
        category: task.category,
        sourceId: taskId,
        // Include all proof types if requested
        proofFiles: includeProof ? proofFiles || [] : [],
        proofText: includeProof ? proofText || "" : "",
        proofLink: includeProof ? proofLink || "" : "",
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
    res
      .status(500)
      .json({ message: error.message || "Failed to share task to portfolio" });
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
