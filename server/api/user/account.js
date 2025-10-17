import express from "express";
import { getUserFromRequest, updateUser } from "../../lib/db.js";

const router = express.Router();

// PATCH /api/user/account - Update account information
router.patch("/", async (req, res) => {
  try {
    // Get user from session or authentication token
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Extract and validate the update data
    const { name, username, email } = req.body;

    // Validate email if provided
    if (email && !email.includes("@")) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate username if provided
    if (username && username.length < 3) {
      return res
        .status(400)
        .json({ error: "Username must be at least 3 characters" });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;

    // Update user in database - ADDED AWAIT
    const updatedUser = await updateUser(user.id, updateData);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return updated user data (without sensitive information)
    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
    });
  } catch (error) {
    console.error("Error updating user account:", error);

    // Provide more specific error messages
    if (error.message?.includes("unique constraint")) {
      return res.status(409).json({
        error: "Username or email already exists",
      });
    }

    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
