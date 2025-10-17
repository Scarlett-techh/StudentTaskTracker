// server/lib/db.js - Updated to use PostgreSQL
import { db } from "../db"; // Changed from '../db.js' to '../db'
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Create new user
export async function createUser(userData) {
  try {
    // Hash password if provided
    const hashedPassword = userData.password
      ? await bcrypt.hash(userData.password, 12)
      : "oauth_user_no_password"; // Default for OAuth users

    const [newUser] = await db
      .insert(users)
      .values({
        username: userData.username,
        password: hashedPassword,
        email: userData.email,
        firstName: userData.firstName || userData.name?.split(" ")[0] || "User",
        lastName:
          userData.lastName ||
          userData.name?.split(" ").slice(1).join(" ") ||
          "Unknown",
        dateOfBirth: userData.dateOfBirth || "2000-01-01",
        name: userData.name || `${userData.firstName} ${userData.lastName}`,
        avatar: userData.avatar || userData.profileImageUrl || null,
        replitId: userData.replitId || null,
        profileImageUrl: userData.profileImageUrl || null,
        userType: userData.userType || "student",
      })
      .returning();

    return newUser || null;
  } catch (error) {
    console.error("Error creating user:", error);

    // Handle specific database errors
    if (error.code === "23505") {
      // Unique constraint violation
      if (error.detail?.includes("username")) {
        throw new Error("Username already exists");
      }
      if (error.detail?.includes("email")) {
        throw new Error("Email already exists");
      }
      if (error.detail?.includes("replit_id")) {
        throw new Error("Replit ID already exists");
      }
    }

    throw error;
  }
}

// Get user by ID
export async function getUserById(id) {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }
}

// Update user
export async function updateUser(id, data) {
  try {
    // If password is being updated, hash it
    if (data.password && data.password !== "oauth_user_no_password") {
      data.password = await bcrypt.hash(data.password, 12);
    }

    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    return updatedUser || null;
  } catch (error) {
    console.error("Error updating user:", error);
    return null;
  }
}

// Get user from request
export async function getUserFromRequest(req) {
  try {
    // First check traditional session
    if (req.session && req.session.user) {
      return await getUserById(req.session.user.id);
    }

    // Then check Replit Auth (Passport)
    if (req.user && req.user.dbUserId) {
      return await getUserById(req.user.dbUserId);
    }

    // Check for user ID in session directly (fallback)
    if (req.session && req.session.userId) {
      return await getUserById(req.session.userId);
    }

    return null;
  } catch (error) {
    console.error("Error getting user from request:", error);
    return null;
  }
}

// Get user by email
export async function getUserByEmail(email) {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}

// Get user by username
export async function getUserByUsername(username) {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || null;
  } catch (error) {
    console.error("Error getting user by username:", error);
    return null;
  }
}

// Get user by Replit ID
export async function getUserByReplitId(replitId) {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.replitId, replitId));
    return user || null;
  } catch (error) {
    console.error("Error getting user by Replit ID:", error);
    return null;
  }
}

// Get all users (for debugging)
export async function getUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
}
