import express from "express";
import { getUserFromRequest, updateUser, createUser } from "../lib/db.js";

const router = express.Router();

// GET /api/user - Get user data (updated for session auth)
router.get("/", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Return user data (without sensitive information)
    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      settings: user.settings ? JSON.parse(user.settings) : {},
    });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/user - Update user
router.patch("/", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Extract and validate the update data
    const { name, username, email, settings, firstName, lastName } = req.body;

    // Validate email if provided
    if (email && !email.includes("@")) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (settings !== undefined) updateData.settings = JSON.stringify(settings);

    // Update user in database
    const updatedUser = await updateUser(user.id, updateData);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update session user data if critical fields changed
    if (req.session.user && (firstName || lastName || username)) {
      req.session.user = {
        ...req.session.user,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      };
    }

    // Return updated user data
    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      userType: updatedUser.userType,
      settings: updatedUser.settings ? JSON.parse(updatedUser.settings) : {},
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/user/mood - Update user mood
router.post("/mood", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { moodType, intensity, note } = req.body;

    // Validate required fields
    if (!moodType || intensity === undefined) {
      return res.status(400).json({
        error: "Mood type and intensity are required",
      });
    }

    // Validate intensity range
    if (intensity < 1 || intensity > 5) {
      return res.status(400).json({
        error: "Intensity must be between 1 and 5",
      });
    }

    // Prepare mood update data
    const updateData = {
      mood: moodType,
      moodIntensity: intensity,
      moodNote: note || null,
      lastMoodUpdate: new Date().toISOString(),
    };

    // Update user in database
    const updatedUser = await updateUser(user.id, updateData);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return success response
    res.json({
      success: true,
      message: "Mood shared successfully",
      mood: {
        moodType,
        intensity,
        note,
        date: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating mood:", error);
    res.status(500).json({
      error: "Failed to save mood. Please try again.",
    });
  }
});

// GET /api/user/mood/today - Get today's mood
router.get("/mood/today", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // For now, return null since we're storing mood in user profile
    // In the future, you might want to implement proper mood history
    if (user.mood && user.lastMoodUpdate) {
      const lastUpdate = new Date(user.lastMoodUpdate);
      const today = new Date();

      // Check if mood was updated today
      if (lastUpdate.toDateString() === today.toDateString()) {
        res.json({
          id: user.id,
          userId: user.id,
          moodType: user.mood,
          intensity: user.moodIntensity || 3,
          note: user.moodNote,
          date: user.lastMoodUpdate,
          createdAt: user.lastMoodUpdate,
        });
        return;
      }
    }

    // No mood for today
    res.json(null);
  } catch (error) {
    console.error("Error fetching today's mood:", error);
    res.status(500).json({
      error: "Failed to fetch mood data",
    });
  }
});

export default router;
