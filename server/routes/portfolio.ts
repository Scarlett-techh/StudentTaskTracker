// server/routes/portfolio.ts (FIXED VERSION)
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { db } from "../db.js";
import { portfolioItems, users } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

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

// ✅ FIXED: Session-based authentication middleware (consistent with tasks route)
const requireAuth = (req: any, res: any, next: any) => {
  console.log(
    "🔐 [PORTFOLIO AUTH] Checking session for user:",
    req.session?.user,
  );

  if (!req.session.user) {
    console.log("❌ [PORTFOLIO AUTH] No user in session - returning 401");
    return res.status(401).json({
      error: "Unauthorized - Please log in again",
      code: "NO_SESSION",
    });
  }

  console.log("✅ [PORTFOLIO AUTH] User authenticated:", req.session.user.id);
  req.user = req.session.user;
  next();
};

// ✅ FIXED: Portfolio storage functions using Drizzle ORM
const portfolioStorage = {
  // Get all portfolio items for user
  async getPortfolioItems(userId: number) {
    try {
      console.log("📚 [PORTFOLIO] Fetching items for user:", userId);
      const items = await db
        .select()
        .from(portfolioItems)
        .where(eq(portfolioItems.userId, userId))
        .orderBy(desc(portfolioItems.createdAt));

      console.log(
        `✅ [PORTFOLIO] Found ${items.length} items for user ${userId}`,
      );
      return items;
    } catch (error) {
      console.error("❌ [PORTFOLIO] Error getting portfolio items:", error);
      throw error;
    }
  },

  // Get single portfolio item
  async getPortfolioItem(itemId: number) {
    try {
      const [item] = await db
        .select()
        .from(portfolioItems)
        .where(eq(portfolioItems.id, itemId));
      return item;
    } catch (error) {
      console.error("❌ [PORTFOLIO] Error getting portfolio item:", error);
      throw error;
    }
  },

  // Create portfolio item
  async createPortfolioItem(itemData: any) {
    try {
      console.log("➕ [PORTFOLIO] Creating portfolio item:", itemData);

      // Ensure required fields
      const dataToInsert = {
        userId: itemData.userId,
        title: itemData.title,
        description: itemData.description || "",
        subject: itemData.subject || "General",
        type: itemData.type || "file",
        filePath: itemData.filePath || null,
        fileUrl: itemData.fileUrl || null,
        fileName: itemData.fileName || null,
        fileType: itemData.fileType || null,
        link: itemData.link || null,
        taskId: itemData.taskId || null,
        proofFiles: itemData.proofFiles || [],
        proofText: itemData.proofText || "",
        proofLink: itemData.proofLink || "",
        attachments: itemData.attachments || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [newItem] = await db
        .insert(portfolioItems)
        .values(dataToInsert)
        .returning();

      console.log("✅ [PORTFOLIO] Portfolio item created:", newItem.id);
      return newItem;
    } catch (error) {
      console.error("❌ [PORTFOLIO] Error creating portfolio item:", error);
      throw error;
    }
  },

  // Delete portfolio item
  async deletePortfolioItem(itemId: number) {
    try {
      const [deletedItem] = await db
        .delete(portfolioItems)
        .where(eq(portfolioItems.id, itemId))
        .returning();
      return deletedItem;
    } catch (error) {
      console.error("❌ [PORTFOLIO] Error deleting portfolio item:", error);
      throw error;
    }
  },
};

// Helper function to get MIME type from filename
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

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
    console.error("❌ [PORTFOLIO] Error serving file:", error);
    res.status(500).json({ message: "Error serving file" });
  }
});

// ✅ FIXED: Get portfolio items for authenticated user
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.user.id;
    console.log("📚 [PORTFOLIO] Fetching items for user:", userId);

    const items = await portfolioStorage.getPortfolioItems(userId);

    // Enhance items with file URLs for frontend compatibility
    const enhancedItems = items.map((item) => {
      const enhancedItem: any = { ...item };

      // For file-based items, ensure fileUrl is set
      if (item.filePath && !item.fileUrl) {
        const filename = path.basename(item.filePath);
        enhancedItem.fileUrl = `/api/portfolio/files/${filename}`;
      }

      // For task items, ensure proofUrl is set for first proof file
      if (
        item.type === "task" &&
        item.proofFiles &&
        item.proofFiles.length > 0
      ) {
        enhancedItem.proofUrl = item.proofFiles[0];
      }

      return enhancedItem;
    });

    console.log(`✅ [PORTFOLIO] Returning ${enhancedItems.length} items`);
    res.json({
      success: true,
      items: enhancedItems,
      count: enhancedItems.length,
    });
  } catch (error: any) {
    console.error("❌ [PORTFOLIO] Error fetching portfolio items:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch portfolio items",
      code: "PORTFOLIO_FETCH_ERROR",
    });
  }
});

// ✅ FIXED: Create portfolio item with file upload
router.post(
  "/upload",
  requireAuth,
  upload.array("files"),
  async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const { title, description, subject, type, link } = req.body;
      const files = req.files as Express.Multer.File[];

      console.log("➕ [PORTFOLIO] Creating portfolio item via upload:", {
        userId,
        title,
        type,
        fileCount: files?.length,
      });

      if (!title) {
        return res.status(400).json({
          error: "Title is required",
          code: "MISSING_TITLE",
        });
      }

      const savedItems = [];

      // Handle file uploads
      if ((type === "file" || type === "photo") && files && files.length > 0) {
        for (const file of files) {
          const filename = path.basename(file.path);
          const fileUrl = `/api/portfolio/files/${filename}`;

          const portfolioData = {
            userId,
            title:
              files.length > 1
                ? `${title} (${files.indexOf(file) + 1})`
                : title,
            description: description || "",
            subject: subject || "General",
            type: type === "photo" ? "photo" : "file",
            filePath: file.path,
            fileUrl: fileUrl,
            fileType: file.mimetype.startsWith("image/")
              ? "image"
              : file.mimetype === "application/pdf"
                ? "pdf"
                : "other",
            fileName: file.originalname,
            link: null,
            attachments: [
              {
                filename: file.originalname,
                path: file.path,
                mimetype: file.mimetype,
                size: file.size,
                url: fileUrl,
              },
            ],
          };

          const newItem =
            await portfolioStorage.createPortfolioItem(portfolioData);
          savedItems.push(newItem);
        }
      } else if (type === "link") {
        // Handle link type items
        if (!link) {
          return res.status(400).json({
            error: "Link is required for link type items",
            code: "MISSING_LINK",
          });
        }

        const portfolioData = {
          userId,
          title,
          description: description || "",
          subject: subject || "General",
          type: "link",
          link: link,
          attachments: [],
        };

        const newItem =
          await portfolioStorage.createPortfolioItem(portfolioData);
        savedItems.push(newItem);
      } else {
        return res.status(400).json({
          error: "Files are required for file/photo types",
          code: "MISSING_FILES",
        });
      }

      res.status(201).json({
        success: true,
        items: savedItems,
        message: `Successfully created ${savedItems.length} portfolio item(s)`,
      });
    } catch (error: any) {
      console.error("❌ [PORTFOLIO] Error creating portfolio item:", error);
      res.status(500).json({
        error: error.message || "Failed to create portfolio item",
        code: "PORTFOLIO_CREATE_ERROR",
      });
    }
  },
);

// ✅ FIXED: Create portfolio item (for non-file items)
router.post("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.user.id;
    const { title, description, subject, type, link } = req.body;

    console.log("➕ [PORTFOLIO] Creating portfolio item:", {
      userId,
      title,
      type,
    });

    if (!title) {
      return res.status(400).json({
        error: "Title is required",
        code: "MISSING_TITLE",
      });
    }

    const portfolioData = {
      userId,
      title,
      description: description || "",
      subject: subject || "General",
      type: type || "file",
      link: type === "link" ? link : null,
      attachments: [],
    };

    const newItem = await portfolioStorage.createPortfolioItem(portfolioData);

    res.status(201).json({
      success: true,
      item: newItem,
      message: "Portfolio item created successfully",
    });
  } catch (error: any) {
    console.error("❌ [PORTFOLIO] Error creating portfolio item:", error);
    res.status(500).json({
      error: error.message || "Failed to create portfolio item",
      code: "PORTFOLIO_CREATE_ERROR",
    });
  }
});

// ✅ FIXED: Share task to portfolio
router.post("/share-task", requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.user.id;
    const {
      taskId,
      title,
      description,
      subject,
      proofFiles = [],
      proofText = "",
      proofLink = "",
    } = req.body;

    console.log("📋 [PORTFOLIO] Sharing task to portfolio:", {
      userId,
      taskId,
      title,
      proofFilesCount: proofFiles.length,
    });

    if (!title) {
      return res.status(400).json({
        error: "Title is required",
        code: "MISSING_TITLE",
      });
    }

    const portfolioData = {
      userId,
      title,
      description: description || `Completed task: ${title}`,
      subject: subject || "General",
      type: "task",
      taskId: taskId || null,
      proofFiles: proofFiles || [],
      proofText: proofText || "",
      proofLink: proofLink || "",
      attachments: proofFiles.map((file: string, index: number) => ({
        filename: `proof-${index + 1}`,
        path: file,
        url: file.startsWith("/") ? file : `/api/portfolio/files/${file}`,
        mimetype: getMimeType(file),
        size: 0,
      })),
    };

    const newItem = await portfolioStorage.createPortfolioItem(portfolioData);

    res.status(201).json({
      success: true,
      item: newItem,
      message: "Task successfully shared to portfolio",
    });
  } catch (error: any) {
    console.error("❌ [PORTFOLIO] Error sharing task to portfolio:", error);
    res.status(500).json({
      error: error.message || "Failed to share task to portfolio",
      code: "SHARE_TASK_ERROR",
    });
  }
});

// ✅ FIXED: Delete portfolio item
router.delete("/:id", requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.user.id;
    const itemId = Number(req.params.id);

    console.log(
      "🗑️ [PORTFOLIO] Deleting portfolio item:",
      itemId,
      "for user:",
      userId,
    );

    // Verify the portfolio item belongs to the user
    const item = await portfolioStorage.getPortfolioItem(itemId);
    if (!item || item.userId !== userId) {
      return res.status(404).json({
        error: "Portfolio item not found",
        code: "ITEM_NOT_FOUND",
      });
    }

    // Delete the associated file if it exists
    if (item.filePath && fs.existsSync(item.filePath)) {
      fs.unlinkSync(item.filePath);
    }

    await portfolioStorage.deletePortfolioItem(itemId);

    res.json({
      success: true,
      message: "Portfolio item deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ [PORTFOLIO] Error deleting portfolio item:", error);
    res.status(500).json({
      error: error.message || "Failed to delete portfolio item",
      code: "PORTFOLIO_DELETE_ERROR",
    });
  }
});

export default router;
