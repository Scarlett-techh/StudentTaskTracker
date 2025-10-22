// server/routes/mood.ts
import express from "express";
import { storage } from "../storage.js";

const router = express.Router();

// Session-based authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  console.log("😊 [MOOD AUTH] Checking session for user:", req.session?.user);

  if (!req.session.user) {
    console.log("❌ [MOOD AUTH] No user in session - returning 401");
    return res.status(401).json({
      error: "Unauthorized - Please log in again",
      code: "NO_SESSION",
    });
  }

  console.log("✅ [MOOD AUTH] User authenticated:", req.session.user.id);
  req.user = req.session.user;
  next();
};

// Create mood entry
router.post("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.user.id;
    const { moodType, intensity, note } = req.body;

    console.log("😊 [MOOD] Creating mood entry for user:", userId, req.body);

    // Validate required fields
    if (!moodType || !intensity) {
      return res.status(400).json({
        error: "Mood type and intensity are required",
        code: "MISSING_FIELDS",
      });
    }

    // Create mood entry
    const moodEntry = await storage.createMood({
      userId,
      moodType,
      intensity: parseInt(intensity),
      note: note || null,
      date: new Date().toISOString().split("T")[0], // Today's date
    });

    console.log("✅ [MOOD] Mood entry created:", moodEntry.id);

    res.json({
      success: true,
      message: "Mood recorded successfully",
      mood: moodEntry,
    });
  } catch (error: any) {
    console.error("❌ [MOOD] Error creating mood entry:", error);
    res.status(500).json({
      error: error.message || "Failed to record mood",
      code: "MOOD_CREATE_ERROR",
    });
  }
});

// Get today's mood for current user
router.get("/today", requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.user.id;
    const today = new Date().toISOString().split("T")[0];

    console.log("😊 [MOOD] Fetching today's mood for user:", userId);

    const todaysMood = await storage.getTodaysMood(userId, today);

    res.json({
      mood: todaysMood,
    });
  } catch (error: any) {
    console.error("❌ [MOOD] Error fetching today's mood:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch mood",
      code: "MOOD_FETCH_ERROR",
    });
  }
});

// Get mood history for current user
router.get("/history", requireAuth, async (req: any, res) => {
  try {
    const userId = req.session.user.id;
    const { limit = 30 } = req.query; // Default to last 30 days

    console.log("😊 [MOOD] Fetching mood history for user:", userId);

    const moodHistory = await storage.getMoodHistory(userId, parseInt(limit));

    res.json({
      moodHistory: moodHistory || [],
    });
  } catch (error: any) {
    console.error("❌ [MOOD] Error fetching mood history:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch mood history",
      code: "MOOD_HISTORY_ERROR",
    });
  }
});

export default router;
