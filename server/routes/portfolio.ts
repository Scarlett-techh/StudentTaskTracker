// server/routes/portfolio.ts (updated)
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { storage } from "../storage.js";
import { isAuthenticated } from "../replitAuth.js";
import { db } from "../db.js";

const router = express.Router();

// ✅ Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../../uploads/portfolio");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage setup with custom filename
const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storageConfig,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// ========================
// Portfolio Routes
// ========================

// Serve portfolio files
router.get("/files/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
      ".mp4": "video/mp4",
      ".mov": "video/quicktime",
      ".avi": "video/x-msvideo",
    };

    const mimeType = mimeTypes[ext] || "application/octet-stream";
    res.setHeader("Content-Type", mimeType);

    // Send the file
    res.sendFile(filePath);
  } catch (error: any) {
    console.error("Error serving file:", error);
    res.status(500).json({ message: "Error serving file" });
  }
});

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

    // Enhance items with file URLs
    const enhancedItems = items.map((item) => {
      if (item.filePath) {
        const filename = path.basename(item.filePath);
        return {
          ...item,
          fileUrl: `/api/portfolio/files/${filename}`,
          proofUrl: `/api/portfolio/files/${filename}`, // For compatibility
        };
      }
      return item;
    });

    res.json(enhancedItems || []);
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
          const filename = path.basename(file.path);
          const fileUrl = `/api/portfolio/files/${filename}`;

          // Determine file type
          const fileType = file.mimetype.startsWith("image/")
            ? "image"
            : file.mimetype === "application/pdf"
              ? "pdf"
              : "other";

          const portfolioData = {
            userId: user.id,
            title:
              files.length > 1
                ? `${title} (${files.indexOf(file) + 1})`
                : title,
            description,
            subject,
            type: type === "photo" ? "photo" : "file",
            filePath: file.path,
            fileUrl: fileUrl,
            fileType: fileType,
            fileName: file.originalname,
            link: type === "link" ? link : null,
            attachments: [
              {
                filename: file.originalname,
                path: file.path,
                mimetype: file.mimetype,
                size: file.size,
                url: fileUrl,
              },
            ],
            createdAt: new Date(),
          };

          const newItem = await storage.createPortfolioItem(portfolioData);

          // Add fileUrl to the response
          const enhancedItem = {
            ...newItem,
            fileUrl: fileUrl,
            proofUrl: fileUrl, // For compatibility
          };

          savedItems.push(enhancedItem);
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
          createdAt: new Date(),
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

    // Delete the associated file if it exists
    if (item.filePath && fs.existsSync(item.filePath)) {
      fs.unlinkSync(item.filePath);
    }

    await storage.deletePortfolioItem(itemId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
