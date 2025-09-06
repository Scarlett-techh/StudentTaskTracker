import express from 'express';
import { getUserFromRequest, updateUser } from '../../lib/db.js';

const router = express.Router();

// PATCH /api/user/account - Update account information
router.patch('/', async (req, res) => {
  try {
    // Get user from session or authentication token
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract and validate the update data
    const { name, username, email } = req.body;

    // Validate email if provided
    if (email && !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;

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
      email: updatedUser.email
    });
  } catch (error) {
    console.error('Error updating user account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;