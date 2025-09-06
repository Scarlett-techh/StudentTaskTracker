// server/lib/db.js
import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data');
const usersFile = path.join(dataPath, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// Initialize users file if it doesn't exist
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify([
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
  ]));
}

// Read users from file
function readUsers() {
  try {
    const data = fs.readFileSync(usersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users:', error);
    return [];
  }
}

// Write users to file
function writeUsers(users) {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users:', error);
  }
}

// Get user by ID
export function getUserById(id) {
  const users = readUsers();
  return users.find(user => user.id === id);
}

// Update user
export function updateUser(id, data) {
  const users = readUsers();
  const userIndex = users.findIndex(user => user.id === id);

  if (userIndex === -1) return null;

  users[userIndex] = { ...users[userIndex], ...data };
  writeUsers(users);

  return users[userIndex];
}

// Get user from request (simplified for demo)
export function getUserFromRequest(req) {
  // In a real app, you would get user from session or JWT
  // For demo purposes, we'll just return the first user
  const users = readUsers();
  return users[0];
}

// Get all users (for debugging)
export function getUsers() {
  return readUsers();
}