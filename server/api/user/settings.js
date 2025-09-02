import express from 'express';
import { getUserFromRequest, updateUser } from '../../lib/db.js';

const router = express.Router();

// PATCH /api/user/settings - Update user settings
router.patch('/', async (req, res) => {
  try {
    // Get user from session or authentication token
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const settings = req.body;

    // Update user in database
    const updatedUser = updateUser(user.id, { settings: JSON.stringify(settings) });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return updated settings
    res.json({
      settings: updatedUser.settings ? JSON.parse(updatedUser.settings) : {}
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;