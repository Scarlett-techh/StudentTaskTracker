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
    const shareFlags = req.body.shareFlags || {}; // Object with fileIndex: boolean

    // Update task status to completed
    const updatedTask = await storage.updateTask(parseInt(taskId), {
      status: "completed",
      updatedAt: new Date(),
    });

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Process each uploaded file
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

      // If file should be shared to portfolio, create portfolio item
      if (shareToPortfolio) {
        await storage.createPortfolioItem({
          userId: user.id,
          title: `Proof: ${file.originalname}`,
          description: `Completed task: ${updatedTask.title}`,
          type: "file",
          subject: updatedTask.subject,
          sourceId: savedFile.id,
          filePath: savedFile.fileName,
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

    const taskFiles = await storage.getFilesByTaskId(parseInt(taskId));
    res.json(taskFiles);
  } catch (error: any) {
    console.error("Error fetching task files:", error);
    res.status(500).json({ message: error.message || "Failed to fetch task files" });
  }
});

export default router;