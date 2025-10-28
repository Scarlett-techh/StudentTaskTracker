import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

// JWT secret key - use environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret-key-change-in-production";

// Middleware to verify JWT token
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.error('❌ [AUTH] Token verification failed:', err);
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    
    req.user = user;
    next();
  });
};

// Generate JWT token
const generateToken = (user: any) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      userType: user.userType
    },
    JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

// Register new user
router.post("/register", async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      firstName,
      lastName,
      dateOfBirth,
      userType = "student",
    } = req.body;

    // Validate required fields
    if (
      !username ||
      !password ||
      !email ||
      !firstName ||
      !lastName ||
      !dateOfBirth
    ) {
      return res.status(400).json({
        error:
          "All fields are required: username, password, email, firstName, lastName, dateOfBirth",
      });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .then((rows) => rows[0]);

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists with this email",
      });
    }

    // Check if username is taken
    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .then((rows) => rows[0]);

    if (existingUsername) {
      return res.status(409).json({
        error: "Username already taken",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        password: hashedPassword,
        email,
        firstName,
        lastName,
        dateOfBirth,
        userType,
        name: `${firstName} ${lastName}`,
      })
      .returning();

    console.log('✅ [REGISTER] User created:', newUser.id);

    // Generate JWT token instead of using session
    const token = generateToken(newUser);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        userType: newUser.userType,
        name: newUser.name,
      },
      token: token // Send token to client
    });

  } catch (error: any) {
    console.error("❌ [REGISTER] Error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// Login user - USING JWT INSTEAD OF SESSIONS
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    console.log('🔐 [LOGIN] Attempting login for:', email);

    // Find user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .then((rows) => rows[0]);

    if (!user) {
      console.log('❌ [LOGIN] User not found:', email);
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ [LOGIN] Invalid password for:', email);
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    console.log('✅ [LOGIN] Password valid for user:', user.id);

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        name: user.name,
      },
      token: token // Send token to client
    });

  } catch (error: any) {
    console.error("❌ [LOGIN] Error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// Get current user - PROTECTED WITH JWT
router.get("/user", authenticateToken, async (req: any, res) => {
  try {
    console.log('👤 [GET USER] JWT user:', req.user);

    // Get fresh user data from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .then((rows) => rows[0]);

    if (!user) {
      console.log('❌ [GET USER] User not found in DB:', req.user.id);
      return res.status(404).json({ error: "User not found" });
    }

    console.log('✅ [GET USER] Returning user data for:', user.id);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        name: user.name,
        points: user.points,
        level: user.level,
        streak: user.streak,
      },
    });
  } catch (error: any) {
    console.error("❌ [GET USER] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Debug endpoint (no auth required)
router.get("/debug", (req, res) => {
  const debugInfo = {
    headers: req.headers,
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  };

  console.log('🐛 [AUTH DEBUG]', debugInfo);
  res.json(debugInfo);
});

// Token validation endpoint
router.post("/validate-token", authenticateToken, (req: any, res) => {
  res.json({ 
    valid: true,
    user: req.user 
  });
});

// Logout user - With JWT, logout is handled client-side by removing the token
router.post("/logout", (req, res) => {
  console.log('🚪 [LOGOUT] User logging out');
  // With JWT, there's no server-side session to destroy
  // Client should remove the token from storage
  res.json({ message: "Logout successful" });
});

export default router;
export { authenticateToken };
