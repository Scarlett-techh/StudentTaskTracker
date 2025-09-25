// server/routes/tasks.ts
import express from "express";
import multer from "multer";
import { storage } from "../storage.ts";
import { isAuthenticated } from "../replitAuth.ts";
import { sendTaskShareEmail } from "../email.ts"; // Fixed import

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Share task via email - UPDATED WITH BETTER ERROR HANDLING
router.post("/:taskId/share", isAuthenticated, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const {
      recipientEmail,
      message,
      taskTitle,
      taskCategory,
      taskDescription,
      proofFiles,
      proofText,
      proofLink,
    } = req.body;

    console.log("Share task request received:", {
      taskId,
      recipientEmail,
      hasMessage: !!message,
      hasTaskTitle: !!taskTitle,
      hasProof: !!(proofFiles || proofText || proofLink),
    });

    // Validate required fields
    if (!recipientEmail) {
      return res.status(400).json({ message: "Recipient email is required" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res
        .status(400)
        .json({ message: "Invalid recipient email format" });
    }

    // Get user ID from session
    let userId;
    if (req.user.claims && req.user.claims.sub) {
      userId = req.user.claims.sub;
    } else if (req.user.replitId) {
      userId = req.user.replitId;
    } else if (req.user.id) {
      userId = req.user.id;
    } else {
      console.error("User ID not found in session:", req.user);
      return res
        .status(401)
        .json({ message: "User not authenticated properly" });
    }

    const user = await storage.getUserByReplitId(userId);
    if (!user) {
      console.error("User not found for ID:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    // Verify user owns this task
    const task = await storage.getTask(parseInt(taskId));
    if (!task) {
      console.error("Task not found:", taskId);
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.userId !== user.id) {
      console.error("Task ownership mismatch:", {
        taskUserId: task.userId,
        currentUserId: user.id,
      });
      return res
        .status(403)
        .json({ message: "You don't have permission to share this task" });
    }

    // Generate shareable URL
    const baseUrl =
      process.env.FRONTEND_URL ||
      process.env.REPLIT_DOMAINS?.split(",")[0] ||
      process.env.REPLIT_PUBLIC_DOMAIN ||
      "http://localhost:3000";

    const shareUrl = `${baseUrl}/share/task/${taskId}`;

    console.log("Email configuration check:", {
      baseUrl,
      shareUrl,
      hasEmailConfig:
        !!process.env.MAILERSEND_API_TOKEN || !!process.env.SMTP_HOST,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`.trim(),
    });

    // Prepare email content with proof if available
    const emailContent = {
      to: recipientEmail,
      fromName: `${user.firstName} ${user.lastName}`.trim() || user.email,
      taskTitle: taskTitle || task.title,
      taskDescription:
        taskDescription || task.description || "No description provided",
      customMessage: message,
      shareUrl: shareUrl,
      // Include proof data if provided
      hasProof: !!(proofFiles || proofText || proofLink),
      proofText: proofText,
      proofLink: proofLink,
      proofFilesCount: proofFiles ? proofFiles.length : 0,
    };

    console.log("Sending share email with content:", emailContent);

    // Send email using MailerSend
    const emailSent = await sendTaskShareEmail(emailContent);

    if (!emailSent) {
      console.error("Email sending failed for task:", taskId);
      return res.status(500).json({
        message: "Failed to send email. Please check email configuration.",
      });
    }

    console.log("Task share email sent successfully to:", recipientEmail);

    // Log the share activity
    await storage.createActivityLog({
      userId: user.id,
      action: "TASK_SHARED",
      description: `Shared task "${task.title}" with ${recipientEmail}`,
      metadata: {
        taskId: task.id,
        recipientEmail: recipientEmail,
        hasProof: emailContent.hasProof,
      },
    });

    res.json({
      success: true,
      message: "Task shared successfully",
      shareUrl: shareUrl,
      recipientEmail: recipientEmail,
    });
  } catch (error: any) {
    console.error("Error sharing task:", error);
    res.status(500).json({
      message: error.message || "Failed to share task",
      ...(process.env.NODE_ENV === "development" && {
        stack: error.stack,
        details: "Check email configuration and server logs",
      }),
    });
  }
});

// NEW ENDPOINT: Share multiple items to coach
router.post("/share/send-to-coach", isAuthenticated, async (req: any, res) => {
  try {
    const { coachEmail, message, items, totalItems } = req.body;

    console.log("Share to coach request:", {
      coachEmail,
      itemCount: totalItems,
      hasMessage: !!message,
    });

    if (!coachEmail) {
      return res.status(400).json({ message: "Coach email is required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(coachEmail)) {
      return res.status(400).json({ message: "Invalid coach email format" });
    }

    // Get user
    let userId;
    if (req.user.claims && req.user.claims.sub) {
      userId = req.user.claims.sub;
    } else if (req.user.replitId) {
      userId = req.user.replitId;
    } else {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await storage.getUserByReplitId(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send email to coach
    const emailContent = {
      to: coachEmail,
      fromName: `${user.firstName} ${user.lastName}`.trim() || user.email,
      subject: `Student Work Shared - ${totalItems} Items`,
      message:
        message ||
        `${user.firstName} has shared ${totalItems} work items with you.`,
      items: items,
      totalItems: totalItems,
      studentName: `${user.firstName} ${user.lastName}`.trim(),
    };

    // You'll need to implement sendCoachShareEmail function in email.js
    const emailSent = await sendTaskShareEmail(emailContent); // Using existing function for now

    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send email to coach" });
    }

    // Log the activity
    await storage.createActivityLog({
      userId: user.id,
      action: "ITEMS_SHARED_WITH_COACH",
      description: `Shared ${totalItems} items with coach ${coachEmail}`,
      metadata: {
        coachEmail: coachEmail,
        itemCount: totalItems,
        itemTypes: [...new Set(items.map((item: any) => item.type))],
      },
    });

    res.json({
      success: true,
      message: `Successfully shared ${totalItems} items with ${coachEmail}`,
    });
  } catch (error: any) {
    console.error("Error sharing with coach:", error);
    res.status(500).json({
      message: error.message || "Failed to share items with coach",
    });
  }
});

// Mark task as complete with proof of work
router.put(
  "/:taskId/complete",
  isAuthenticated,
  upload.array("proofFiles"),
  async (req: any, res) => {
    try {
      const { taskId } = req.params;
      const userId = req.user.claims?.sub || req.user.replitId || req.user.id;
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
        updateData.proofFiles = uploadedFiles.map(
          (file) =>
            `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
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

      const updatedTask = await storage.updateTask(
        parseInt(taskId),
        updateData,
      );

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
            type: file.mimetype.startsWith("image/") ? "photo" : "file",
            name: file.originalname,
            url: dataUri, // Use the base64 data URI for direct access
            size: file.size,
            title: file.originalname,
            mimeType: file.mimetype,
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
      res
        .status(500)
        .json({ message: error.message || "Failed to complete task" });
    }
  },
);

// Get task proof files
router.get("/:taskId/files", isAuthenticated, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.claims?.sub || req.user.replitId || req.user.id;
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
      proofText: task.proofText || "",
      proofLink: task.proofLink || "",
    };

    res.json(proofData);
  } catch (error: any) {
    console.error("Error fetching task files:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to fetch task files" });
  }
});

export default router;
