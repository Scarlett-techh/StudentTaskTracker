// server/routes/files.ts
import express from "express";
import multer from "multer";
import { storage } from "../storage.ts";
import { isAuthenticated } from "../replitAuth.ts";
import { db } from "../db";
import { photos } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Upload a new file
router.post("/", isAuthenticated, upload.single("file"), async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUserByReplitId(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const file = req.file;
    const { taskId } = req.body;

    // Convert file buffer to base64
    const base64Data = file.buffer.toString("base64");
    const dataUri = `data:${file.mimetype};base64,${base64Data}`;

    // Save file to database
    const savedFile = await storage.createFile({
      userId: user.id,
      originalName: file.originalname,
      fileName: `${Date.now()}-${file.originalname}`,
      mimeType: file.mimetype,
      size: file.size,
      fileData: dataUri,
      taskId: taskId ? parseInt(taskId) : null,
      shareToPortfolio: false, // Default to not sharing with portfolio
    });

    res.json(savedFile);
  } catch (error: any) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: error.message || "Failed to upload file" });
  }
});

// Get a file by ID
router.get("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const userId = req.user.claims.sub;
    const user = await storage.getUserByReplitId(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const file = await storage.getFile(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check if the user owns this file
    if (file.userId !== user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(file);
  } catch (error: any) {
    console.error("Error fetching file:", error);
    res.status(500).json({ message: error.message || "Failed to fetch file" });
  }
});

// Delete a file by ID
router.delete("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const userId = req.user.claims.sub;
    const user = await storage.getUserByReplitId(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const file = await storage.getFile(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check if the user owns this file
    if (file.userId !== user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Delete the file
    await db.delete(photos).where(eq(photos.id, fileId));

    res.json({ success: true, message: "File deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting file:", error);
    res.status(500).json({ message: error.message || "Failed to delete file" });
  }
});

// Update file properties (e.g., shareToPortfolio)
router.patch("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const userId = req.user.claims.sub;
    const user = await storage.getUserByReplitId(userId);
    const { shareToPortfolio } = req.body;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const file = await storage.getFile(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check if the user owns this file
    if (file.userId !== user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update the file
    const updatedFile = await storage.updateFileShareStatus(fileId, shareToPortfolio);

    if (!updatedFile) {
      return res.status(500).json({ message: "Failed to update file" });
    }

    res.json(updatedFile);
  } catch (error: any) {
    console.error("Error updating file:", error);
    res.status(500).json({ message: error.message || "Failed to update file" });
  }
});

export default router;