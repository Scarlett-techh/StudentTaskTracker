// server/routes/tasks.ts
import express from "express";
import multer from "multer";
import { storage } from "../storage.js";
import { isAuthenticated } from "../replitAuth.js";
import { db } from "../db";
import { files, portfolioItems } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Mark task as complete with proof of work
router.put("/:taskId/complete", isAuthenticated, upload.array("proofFiles"), async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.claims.sub;
    const user = await storage.getUserByReplitId(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const uploadedFiles = req.files as Express.Multer.File[];
    const { proofText, proofLink, shareFlags = {} } = req.body;

    // Update task status to completed and include all proof types
    const updateData: any = {
      status: "completed",
      updatedAt: new Date(),
    };

    // Add proof files if any were uploaded
    if (uploadedFiles && uploadedFiles.length > 0) {
      updateData.proofFiles = uploadedFiles.map(file => 
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
      );
    }

    // Add text proof if provided
    if (proofText) {
      updateData.proofText = proofText;
    }

    // Add link proof if provided
    if (proofLink) {
      updateData.proofLink = proofLink;
    }

    const updatedTask = await storage.updateTask(parseInt(taskId), updateData);

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Process each uploaded file for individual file storage (if needed)
    const savedFiles = [];
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const shareToPortfolio = shareFlags[i] === "true";

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
        taskId: parseInt(taskId),
        shareToPortfolio,
      });

      savedFiles.push(savedFile);

      // If file should be shared to portfolio, create portfolio item with proper attachment format
      if (shareToPortfolio) {
        // Create attachment object in the format expected by PortfolioPreview component
        const attachment = {
          type: file.mimetype.startsWith('image/') ? 'photo' : 'file',
          name: file.originalname,
          url: dataUri, // Use the base64 data URI for direct access
          size: file.size,
          title: file.originalname,
          mimeType: file.mimetype
        };

        await storage.createPortfolioItem({
          userId: user.id,
          title: `Proof: ${file.originalname}`,
          description: `Completed task: ${updatedTask.title}`,
          type: "task", // Mark as task-based item
          subject: updatedTask.subject,
          sourceId: parseInt(taskId), // Reference the task, not the file
          filePath: savedFile.fileName,
          attachments: [attachment], // Store attachment in the format expected by preview component
        });
      }
    }

    // Award points for task completion
    await storage.addPoints({
      userId: user.id,
      amount: 10, // Points for task completion
      reason: "Task completed",
      taskId: parseInt(taskId),
    });

    res.json({
      success: true,
      message: "Task completed successfully",
      files: savedFiles,
    });
  } catch (error: any) {
    console.error("Error completing task:", error);
    res.status(500).json({ message: error.message || "Failed to complete task" });
  }
});

// Get task proof files
router.get("/:taskId/files", isAuthenticated, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.claims.sub;
    const user = await storage.getUserByReplitId(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify user owns this task
    const task = await storage.getTask(parseInt(taskId));
    if (!task || task.userId !== user.id) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Get all proof data (files, text, links)
    const proofData = {
      proofFiles: task.proofFiles || [],
      proofText: task.proofText || '',
      proofLink: task.proofLink || ''
    };

    res.json(proofData);
  } catch (error: any) {
    console.error("Error fetching task files:", error);
    res.status(500).json({ message: error.message || "Failed to fetch task files" });
  }
});

export default router;