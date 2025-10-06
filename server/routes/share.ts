// server/routes/share.ts
import express from "express";
import { storage } from "../storage.js";
import { isAuthenticated } from "../replitAuth.js";
import { sendSharedWorkEmail } from "../email.js";

const router = express.Router();

// Share work via email
router.post("/work", isAuthenticated, async (req: any, res) => {
  try {
    console.log(
      "📧 [BACKEND] Share work request received at:",
      new Date().toISOString(),
    );
    console.log("👤 [BACKEND] User ID:", req.user?.claims?.sub);
    console.log("📦 [BACKEND] Full request body:", req.body);

    const userId = req.user.claims.sub;
    const user = await storage.getUserByReplitId(userId);

    if (!user) {
      console.log("❌ [BACKEND] User not found for ID:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ [BACKEND] User found:", user.email);

    const { recipientEmail, message, workItems } = req.body;

    console.log("🔍 [BACKEND] Parsed data:", {
      recipientEmail,
      message,
      workItems,
      workItemsType: typeof workItems,
      isArray: Array.isArray(workItems),
      length: workItems?.length,
    });

    // SIMPLIFIED VALIDATION
    if (!recipientEmail) {
      console.log("❌ [BACKEND] Missing recipientEmail");
      return res.status(400).json({ message: "Recipient email is required" });
    }

    if (!workItems || !Array.isArray(workItems) || workItems.length === 0) {
      console.log("❌ [BACKEND] Invalid workItems:", {
        exists: !!workItems,
        isArray: Array.isArray(workItems),
        length: workItems?.length,
      });
      return res.status(400).json({ message: "Valid work items are required" });
    }

    console.log("✅ [BACKEND] All validations passed");

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      console.log("❌ [BACKEND] Invalid email format:", recipientEmail);
      return res.status(400).json({ message: "Invalid email format" });
    }

    console.log("✅ [BACKEND] Email format validation passed");
    console.log("📧 [BACKEND] Sending email to:", recipientEmail);
    console.log("📦 [BACKEND] Work items to share:", workItems);

    // ADD CURRENT DATE TO WORK ITEMS IF MISSING
    const workItemsWithDates = workItems.map((item: any) => ({
      ...item,
      date: item.date || new Date().toLocaleDateString(),
    }));

    console.log("📧 [BACKEND] Calling sendSharedWorkEmail function...");

    // ACTUALLY SEND THE EMAIL NOW
    const emailSent = await sendSharedWorkEmail(
      recipientEmail,
      user.name || user.email || "Student",
      message || "",
      workItemsWithDates,
    );

    if (emailSent) {
      console.log("✅ [BACKEND] Email sent successfully!");
      return res.json({
        success: true,
        message: `Work shared with ${recipientEmail} successfully!`,
        itemsShared: workItems.length,
      });
    } else {
      console.log("❌ [BACKEND] Failed to send email");
      return res.status(500).json({
        message: "Failed to send email. Please try again later.",
      });
    }
  } catch (error: any) {
    console.error("💥 [BACKEND] Error sharing work:", error);
    console.error("💥 [BACKEND] Error stack:", error.stack);
    return res
      .status(500)
      .json({ message: error.message || "Failed to share work" });
  }
});

// Test endpoint for email functionality (no authentication)
router.post("/test-email-direct", async (req: any, res) => {
  try {
    console.log("🧪 DIRECT EMAIL TEST ENDPOINT HIT");

    // Test the email function directly with simple data
    const testResult = await sendSharedWorkEmail(
      "test@example.com",
      "Test Student",
      "This is a test message",
      [
        {
          id: 1,
          type: "task",
          title: "Test Task",
          subject: "Math",
          preview: "This is a test task description",
          date: new Date().toLocaleDateString(),
        },
      ],
    );

    console.log("🧪 DIRECT EMAIL TEST RESULT:", testResult);

    return res.json({
      success: testResult,
      message: testResult ? "Email test passed!" : "Email test failed",
      testMode: true,
    });
  } catch (error: any) {
    console.error("💥 DIRECT EMAIL TEST ERROR:", error);
    console.error("💥 DIRECT EMAIL TEST STACK:", error.stack);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
});

// Debug endpoint for the main work functionality
router.post("/work-debug", isAuthenticated, async (req: any, res) => {
  try {
    console.log("🐛 [WORK DEBUG] Work debug endpoint hit!");
    console.log("📦 [WORK DEBUG] Request body:", req.body);

    const { recipientEmail, message, workItems } = req.body;

    // Test the exact same validation as the main endpoint
    const validation = {
      hasRecipientEmail: !!recipientEmail,
      hasWorkItems: !!workItems,
      workItemsIsArray: Array.isArray(workItems),
      workItemsLength: workItems?.length || 0,
      workItemsNotEmpty: workItems?.length > 0,
      workItemsFirstItem: workItems?.[0],
      workItemsFirstItemId: workItems?.[0]?.id,
      workItemsFirstItemType: workItems?.[0]?.type,
      workItemsFirstItemTitle: workItems?.[0]?.title,
    };

    console.log("🔍 [WORK DEBUG] Validation check:", validation);

    return res.json({
      success: true,
      received: req.body,
      validation: validation,
      wouldPassMainValidation:
        validation.hasRecipientEmail &&
        validation.hasWorkItems &&
        validation.workItemsIsArray &&
        validation.workItemsNotEmpty,
    });
  } catch (error: any) {
    console.error("💥 [WORK DEBUG] Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Simple test endpoint (no authentication)
router.post("/simple-test", async (req: any, res) => {
  try {
    console.log("🎯 [SIMPLE TEST] Simple test endpoint hit!");
    console.log("📦 [SIMPLE TEST] Request body:", req.body);

    return res.json({
      success: true,
      message: "Simple test endpoint working!",
      received: req.body,
    });
  } catch (error: any) {
    console.error("💥 [SIMPLE TEST] Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Test endpoint to verify the route is working
router.post("/test-receive", isAuthenticated, async (req: any, res) => {
  try {
    console.log("🎯 [BACKEND TEST] Test endpoint hit!");
    console.log("📦 [BACKEND TEST] Request body:", req.body);
    console.log("📧 [BACKEND TEST] recipientEmail:", req.body.recipientEmail);
    console.log("💬 [BACKEND TEST] message:", req.body.message);
    console.log("📋 [BACKEND TEST] workItems:", req.body.workItems);
    console.log(
      "🔢 [BACKEND TEST] workItems length:",
      req.body.workItems?.length,
    );
    console.log(
      "📄 [BACKEND TEST] workItems is array:",
      Array.isArray(req.body.workItems),
    );

    return res.json({
      success: true,
      received: req.body,
      validation: {
        hasRecipientEmail: !!req.body.recipientEmail,
        hasWorkItems: !!req.body.workItems,
        workItemsIsArray: Array.isArray(req.body.workItems),
        workItemsLength: req.body.workItems?.length || 0,
        workItemsNotEmpty: req.body.workItems?.length > 0,
      },
    });
  } catch (error: any) {
    console.error("💥 [BACKEND TEST] Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Test endpoint
router.get("/test", isAuthenticated, (req: any, res) => {
  return res.json({
    message: "Share route is working!",
    user: req.user.claims.sub,
    timestamp: new Date().toISOString(),
  });
});

// Health check
router.get("/health", (req, res) => {
  return res.json({ status: "OK", route: "share" });
});

export default router;
