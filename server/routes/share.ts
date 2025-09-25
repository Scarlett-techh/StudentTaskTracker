// server/routes/share.ts
import express from "express";
import { storage } from "../storage.ts";
import { isAuthenticated } from "../replitAuth.ts";
import { sendTaskShareEmail, sendCoachShareEmail } from "../email.ts";

const router = express.Router();

// Share multiple items with coach (from the share page)
router.post("/send-to-coach", isAuthenticated, async (req: any, res) => {
  try {
    const { coachEmail, message, items, totalItems } = req.body;

    console.log("Share to coach request received:", {
      coachEmail,
      itemCount: totalItems,
      hasMessage: !!message,
      items: items
        ? items.map((item: any) => ({ type: item.type, title: item.title }))
        : [],
    });

    // Validate required fields
    if (!coachEmail) {
      return res.status(400).json({ message: "Coach email is required" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items selected to share" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(coachEmail)) {
      return res.status(400).json({ message: "Invalid coach email format" });
    }

    // Get user from session
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

    console.log("Preparing to send email to coach:", coachEmail);

    // Prepare email content
    const emailContent = {
      to: coachEmail,
      fromName: `${user.firstName} ${user.lastName}`.trim() || user.email,
      subject: `Student Work Shared - ${totalItems} Items`,
      message:
        message || `I've shared ${totalItems} work items with you for review.`,
      items: items,
      totalItems: totalItems,
      studentName: `${user.firstName} ${user.lastName}`.trim() || user.email,
    };

    // Send email to coach
    const emailSent = await sendCoachShareEmail(emailContent);

    if (!emailSent) {
      console.error("Failed to send coach share email");
      return res.status(500).json({
        message:
          "Failed to send email to coach. Please check email configuration.",
      });
    }

    console.log("Coach share email sent successfully to:", coachEmail);

    // Log the share activity
    await storage.createActivityLog({
      userId: user.id,
      action: "ITEMS_SHARED_WITH_COACH",
      description: `Shared ${totalItems} items with coach ${coachEmail}`,
      metadata: {
        coachEmail: coachEmail,
        itemCount: totalItems,
        itemTypes: [...new Set(items.map((item: any) => item.type))],
        messageLength: message ? message.length : 0,
      },
    });

    res.json({
      success: true,
      message: `Successfully shared ${totalItems} items with ${coachEmail}`,
      itemsShared: totalItems,
      recipient: coachEmail,
    });
  } catch (error: any) {
    console.error("Error sharing items with coach:", error);
    res.status(500).json({
      message: error.message || "Failed to share items with coach",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
});

// Share a specific task via email
router.post("/task/:taskId", isAuthenticated, async (req: any, res) => {
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

    console.log("Share task request received via share route:", {
      taskId,
      recipientEmail,
      hasMessage: !!message,
    });

    // Validate required fields
    if (!recipientEmail) {
      return res.status(400).json({ message: "Recipient email is required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res
        .status(400)
        .json({ message: "Invalid recipient email format" });
    }

    // Get user from session
    let userId;
    if (req.user.claims && req.user.claims.sub) {
      userId = req.user.claims.sub;
    } else if (req.user.replitId) {
      userId = req.user.replitId;
    } else if (req.user.id) {
      userId = req.user.id;
    } else {
      return res
        .status(401)
        .json({ message: "User not authenticated properly" });
    }

    const user = await storage.getUserByReplitId(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify task exists and user owns it
    const task = await storage.getTask(parseInt(taskId));
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.userId !== user.id) {
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

    console.log("Sending task share email via share route");

    // Prepare email content
    const emailContent = {
      to: recipientEmail,
      fromName: `${user.firstName} ${user.lastName}`.trim() || user.email,
      taskTitle: taskTitle || task.title,
      taskDescription:
        taskDescription || task.description || "No description provided",
      customMessage: message,
      shareUrl: shareUrl,
      hasProof: !!(proofFiles || proofText || proofLink),
      proofText: proofText,
      proofLink: proofLink,
      proofFilesCount: proofFiles ? proofFiles.length : 0,
    };

    // Send email
    const emailSent = await sendTaskShareEmail(emailContent);

    if (!emailSent) {
      return res.status(500).json({
        message: "Failed to send email. Please check email configuration.",
      });
    }

    console.log("Task share email sent successfully to:", recipientEmail);

    // Log the activity
    await storage.createActivityLog({
      userId: user.id,
      action: "TASK_SHARED",
      description: `Shared task "${task.title}" with ${recipientEmail}`,
      metadata: {
        taskId: task.id,
        recipientEmail: recipientEmail,
        hasProof: emailContent.hasProof,
        hasCustomMessage: !!message,
      },
    });

    res.json({
      success: true,
      message: "Task shared successfully",
      shareUrl: shareUrl,
      recipientEmail: recipientEmail,
    });
  } catch (error: any) {
    console.error("Error sharing task via share route:", error);
    res.status(500).json({
      message: error.message || "Failed to share task",
    });
  }
});

// Get share statistics for user
router.get("/stats", isAuthenticated, async (req: any, res) => {
  try {
    // Get user from session
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

    // Get share statistics from activity logs
    const shareActivities = await storage.getUserActivityLogs(
      user.id,
      "TASK_SHARED",
    );
    const coachShareActivities = await storage.getUserActivityLogs(
      user.id,
      "ITEMS_SHARED_WITH_COACH",
    );

    const stats = {
      totalTasksShared: shareActivities.length,
      totalItemsSharedWithCoach: coachShareActivities.reduce(
        (total, activity) => {
          return total + (activity.metadata?.itemCount || 0);
        },
        0,
      ),
      lastShared:
        shareActivities.length > 0
          ? new Date(
              Math.max(
                ...shareActivities.map((a) => new Date(a.createdAt).getTime()),
              ),
            )
          : null,
      uniqueRecipients: [
        ...new Set(shareActivities.map((a) => a.metadata?.recipientEmail)),
      ].filter(Boolean).length,
    };

    res.json(stats);
  } catch (error: any) {
    console.error("Error fetching share stats:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch share statistics",
    });
  }
});

// Test share endpoint
router.get("/test", isAuthenticated, async (req: any, res) => {
  try {
    res.json({
      success: true,
      message: "Share routes are working correctly",
      timestamp: new Date().toISOString(),
      user: req.user.claims?.sub || req.user.replitId,
    });
  } catch (error: any) {
    console.error("Error in share test endpoint:", error);
    res.status(500).json({
      message: error.message || "Share test failed",
    });
  }
});

// Temporary test route for development
router.post("/test-email", async (req: any, res) => {
  try {
    console.log("Testing enhanced email functionality...");
    
    const testEmailContent = {
      to: "test@example.com",
      studentName: "Test Student",
      message: "This is a test of the enhanced email system",
      totalItems: 2,
      items: [
        {
          title: "Math Assignment - Algebra",
          type: "task",
          description: "Completed all algebra problems with proof",
          subject: "Mathematics",
          date: "2025-09-25",
          proofFiles: ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="],
          proofText: "I solved all 15 equations using the quadratic formula and substitution method. This took me 2 hours to complete.",
          proofLink: "https://khanacademy.org/math/algebra"
        },
        {
          title: "Science Project - Solar System",
          type: "portfolio",
          description: "Created a 3D model of the solar system",
          subject: "Science", 
          date: "2025-09-24",
          attachments: [
            {
              name: "Solar System Model Photo",
              type: "photo",
              url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            },
            {
              name: "Project Documentation",
              type: "link",
              url: "https://nasa.gov/solar-system"
            }
          ]
        }
      ]
    };

    // Test the enhanced email function
    const emailSent = await sendCoachShareEmail(testEmailContent);
    
    if (emailSent) {
      res.json({
        success: true,
        message: "Enhanced email functionality test completed successfully",
        emailContent: testEmailContent,
        features: [
          "Embedded proof images",
          "Formatted student notes",
          "Clickable reference links", 
          "Professional styling",
          "Multiple item support"
        ]
      });
    } else {
      res.status(500).json({ message: "Email sending failed" });
    }
  } catch (error: any) {
    console.error("Email test error:", error);
    res.status(500).json({ message: error.message || "Test failed" });
  }
});

export default router;
