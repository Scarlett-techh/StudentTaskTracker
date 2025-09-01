// server/lib/db.js
// Simple in-memory database for demonstration purposes
// In a real application, you would connect to a proper database

let users = [
  {
    id: 1,
    name: "John Doe",
    username: "johndoe",
    email: "john@example.com",
    settings: JSON.stringify({
      notifications: true,
      emailReminders: true,
      darkMode: false,
      autoSave: true
    })
  }
];

// Get user by ID
export function getUserById(id) {
  return users.find(user => user.id === id);
}

// Update user
export function updateUser(id, data) {
  const userIndex = users.findIndex(user => user.id === id);
  if (userIndex === -1) return null;

  users[userIndex] = { ...users[userIndex], ...data };
  return users[userIndex];
}

// Get user from request (simplified for demo)
export function getUserFromRequest(req) {
  // In a real app, you would get user from session or JWT
  // For demo purposes, we'll just return the first user
  return users[0];
}

// Get all users (for debugging)
export function getUsers() {
  return users;
}