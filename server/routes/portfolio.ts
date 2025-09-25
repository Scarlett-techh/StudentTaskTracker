// server/routes/portfolio.ts
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { storage } from "../storage.ts";
import { isAuthenticated } from "../replitAuth.ts";
import { sendTaskShareEmail } from "../email.ts"; // Import email function for portfolio sharing

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
  }
});

// ========================
// Portfolio Routes
// ========================

// Get portfolio items for authenticated user
router.get("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims?.sub || req.user.replitId || req.user.id;
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

// Get specific portfolio item
router.get("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims?.sub || req.user.replitId || req.user.id;
    const user = await storage.getUserByReplitId(userId);
    const itemId = parseInt(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const item = await storage.getPortfolioItem(itemId);

    if (!item || item.userId !== user.id) {
      return res.status(404).json({ message: "Portfolio item not found" });
    }

    res.json(item);
  } catch (error: any) {
    console.error("Error fetching portfolio item:", error);
    res.status(500).json({ message: error.message || "Failed to fetch portfolio item" });
  }
});

// Create a new portfolio item
router.post("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims?.sub || req.user.replitId || req.user.id;
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

// Share portfolio item via email
router.post("/:id/share", isAuthenticated, async (req: any, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const { recipientEmail, message } = req.body;
    const userId = req.user.claims?.sub || req.user.replitId || req.user.id;

    console.log('Share portfolio request received:', { itemId, recipientEmail });

    if (!recipientEmail) {
      return res.status(400).json({ message: "Recipient email is required" });
    }

    const user = await storage.getUserByReplitId(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify user owns this portfolio item
    const portfolioItem = await storage.getPortfolioItem(itemId);
    if (!portfolioItem || portfolioItem.userId !== user.id) {
      return res.status(404).json({ message: "Portfolio item not found" });
    }

    // Generate shareable URL
    const baseUrl = process.env.FRONTEND_URL || process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/portfolio/${itemId}`;

    console.log('Sending portfolio share email:', {
      to: recipientEmail,
      from: user.email,
      itemTitle: portfolioItem.title,
      shareUrl
    });

    // Send email using MailerSend
    const emailSent = await sendTaskShareEmail(
      recipientEmail,
      `${user.firstName} ${user.lastName}`.trim() || user.email,
      portfolioItem.title,
      portfolioItem.description || 'Portfolio item shared from Student Task Tracker',
      shareUrl
    );

    if (!emailSent) {
      console.error('Email sending failed for portfolio item:', itemId);
      return res.status(500).json({ message: "Failed to send email" });
    }

    console.log('Portfolio share email sent successfully');
    res.json({
      success: true,
      message: "Portfolio item shared successfully",
      shareUrl: shareUrl
    });
  } catch (error: any) {
    console.error("Error sharing portfolio item:", error);
    res.status(500).json({ 
      message: error.message || "Failed to share portfolio item",
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Share task to portfolio with all proof types
router.post("/share-task", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims?.sub || req.user.replitId || req.user.id;
    const user = await storage.getUserByReplitId(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { taskId, portfolioIds, includeProof, proofFiles, proofText, proofLink } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "Task ID is required" });
    }

    // Get task details using storage method
    const task = await storage.getTask(parseInt(taskId));
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Verify task belongs to user
    if (task.userId !== user.id) {
      return res.status(403).json({ message: "You don't have permission to share this task" });
    }

    // If no portfolioIds provided, create one portfolio item
    const targetPortfolioIds = portfolioIds && portfolioIds.length > 0 ? portfolioIds : ['default'];

    // Create portfolio items for each selected portfolio
    const results = [];
    for (const portfolioId of targetPortfolioIds) {
      const portfolioData = {
        userId: user.id,
        title: task.title,
        description: task.description,
        type: 'task',
        subject: task.subject,
        category: task.category,
        sourceId: parseInt(taskId),
        // Include all proof types if requested
        proofFiles: includeProof ? (proofFiles || []) : [],
        proofText: includeProof ? (proofText || '') : '',
        proofLink: includeProof ? (proofLink || '') : '',
        // For backward compatibility, also populate attachments with files
        attachments: includeProof ? (proofFiles || []) : [],
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
    const userId = req.user.claims?.sub || req.user.replitId || req.user.id;
    const user = await storage.getUserByReplitId(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const savedItems = [];
    for (const file of files) {
      const portfolioData = {
        userId: user.id,
        title: file.originalname,
        description: `Uploaded file: ${file.originalname}`,
        type: 'file',
        fileName: file.filename,
        filePath: file.path,
        mimeType: file.mimetype,
        size: file.size,
        attachments: [{
          type: file.mimetype.startsWith('image/') ? 'photo' : 'file',
          name: file.originalname,
          url: `/api/files/portfolio/${file.filename}`,
          size: file.size,
          mimeType: file.mimetype
        }]
      };

      const savedItem = await storage.createPortfolioItem(portfolioData);
      savedItems.push(savedItem);
    }

    res.json({ success: true, items: savedItems });
  } catch (error: any) {
    console.error("Error uploading portfolio files:", error);
    res.status(500).json({ message: error.message || "Failed to upload files" });
  }
});

// Update portfolio item
router.put("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims?.sub || req.user.replitId || req.user.id;
    const user = await storage.getUserByReplitId(userId);
    const itemId = parseInt(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify the portfolio item belongs to the user
    const existingItem = await storage.getPortfolioItem(itemId);
    if (!existingItem || existingItem.userId !== user.id) {
      return res.status(404).json({ message: "Portfolio item not found" });
    }

    const updateData = req.body;
    const updatedItem = await storage.updatePortfolioItem(itemId, updateData);

    if (!updatedItem) {
      return res.status(500).json({ message: "Failed to update portfolio item" });
    }

    res.json(updatedItem);
  } catch (error: any) {
    console.error("Error updating portfolio item:", error);
    res.status(500).json({ message: error.message || "Failed to update portfolio item" });
  }
});

// Delete portfolio item
router.delete("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims?.sub || req.user.replitId || req.user.id;
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
    res.json({ success: true, message: "Portfolio item deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting portfolio item:", error);
    res.status(500).json({ message: error.message || "Failed to delete portfolio item" });
  }
});

export default router;