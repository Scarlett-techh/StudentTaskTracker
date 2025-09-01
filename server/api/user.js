// server/api/user.js
import express from 'express';
import { getUserFromRequest, updateUser } from '../lib/db.js';

const router = express.Router();

// PATCH /api/user - Update user settings
router.patch('/', async (req, res) => {
  try {
    // Get user from session or authentication token
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract and validate the update data
    const { name, username, email, settings } = req.body;

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (settings !== undefined) updateData.settings = JSON.stringify(settings);

    // Update user in database
    const updatedUser = updateUser(user.id, updateData);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return updated user data (without sensitive information)
    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      settings: updatedUser.settings ? JSON.parse(updatedUser.settings) : {}
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/user - Get user data (for the frontend query)
router.get('/', (req, res) => {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Return user data (without sensitive information)
    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      settings: user.settings ? JSON.parse(user.settings) : {}
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;