import express from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

// Add session debugging middleware for this router
router.use((req, res, next) => {
  console.log('🔐 [AUTH ROUTE] Session Debug:', {
    sessionID: req.sessionID,
    hasUser: !!req.session.user,
    user: req.session.user,
    path: req.path
  });
  next();
});

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

    // Set user in session with ALL required fields
    req.session.user = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      userType: newUser.userType,
      name: newUser.name,
    };

    // Save session explicitly with error handling - SIMPLIFIED for Vercel
    req.session.save((err) => {
      if (err) {
        console.error("❌ [REGISTER] Session save error:", err);
        // Even if session fails, still return success but warn about session
        return res.status(201).json({
          message: "User created successfully (session may not be persistent)",
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            userType: newUser.userType,
            name: newUser.name,
          },
          warning: "Session storage issue - you may need to login again"
        });
      }

      console.log('✅ [REGISTER] Session saved for user:', newUser.id);

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
      });
    });

  } catch (error) {
    console.error("❌ [REGISTER] Error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      // Add more details for debugging
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// Login user - FIXED FOR VERCEL
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

    // Set user in session with ALL required fields
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      name: user.name,
    };

    // SIMPLIFIED session save for Vercel - remove Promise wrapper
    req.session.save((err) => {
      if (err) {
        console.error("❌ [LOGIN] Session save error:", err);
        // Even if session fails, still return success but with warning
        return res.json({
          message: "Login successful (session may not be persistent)",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            userType: user.userType,
            name: user.name,
          },
          warning: "Session storage issue - you may need to login again periodically"
        });
      }

      console.log('✅ [LOGIN] Session saved successfully for user:', user.id);

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
      });
    });

  } catch (error) {
    console.error("❌ [LOGIN] Error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      // Add more details for debugging
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// Get current user
router.get("/user", async (req, res) => {
  try {
    console.log('👤 [GET USER] Session check:', {
      sessionID: req.sessionID,
      user: req.session.user
    });

    if (!req.session.user) {
      console.log('❌ [GET USER] No user in session');
      return res.status(401).json({ 
        error: "Not authenticated",
        sessionID: req.sessionID 
      });
    }

    console.log('✅ [GET USER] User found in session:', req.session.user.id);

    // Get fresh user data from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, req.session.user.id))
      .then((rows) => rows[0]);

    if (!user) {
      console.log('❌ [GET USER] User not found in DB:', req.session.user.id);
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
  } catch (error) {
    console.error("❌ [GET USER] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Enhanced debug endpoint to check session
router.get("/debug", (req, res) => {
  const debugInfo = {
    sessionID: req.sessionID,
    session: req.session,
    user: req.session.user,
    cookies: req.headers.cookie,
    headers: {
      'user-agent': req.headers['user-agent'],
      'accept': req.headers['accept'],
    }
  };

  console.log('🐛 [AUTH DEBUG]', debugInfo);

  res.json(debugInfo);
});

// Session check endpoint
router.get("/session", (req, res) => {
  if (req.session.user) {
    res.json({ 
      authenticated: true,
      user: req.session.user 
    });
  } else {
    res.json({ 
      authenticated: false,
      sessionID: req.sessionID 
    });
  }
});

// Logout user
router.post("/logout", (req, res) => {
  console.log('🚪 [LOGOUT] User logging out:', req.session.user?.id);

  req.session.destroy((err) => {
    if (err) {
      console.error("❌ [LOGOUT] Session destroy error:", err);
      return res.status(500).json({ error: "Failed to logout" });
    }

    res.clearCookie("connect.sid");
    console.log('✅ [LOGOUT] Session destroyed successfully');
    res.json({ message: "Logout successful" });
  });
});

export default router;
