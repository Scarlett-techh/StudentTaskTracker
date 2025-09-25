import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import { storage } from "./storage";

// Check for required environment variables
if (!process.env.REPLIT_DOMAINS) {
  console.warn("Environment variable REPLIT_DOMAINS not provided, authentication may not work properly");
}

// Fallback for development
const ISSUER_URL = process.env.ISSUER_URL || "https://replit.com/oidc";
const REPL_ID = process.env.REPL_ID || "default-repl-id";
const SESSION_SECRET = process.env.SESSION_SECRET || "fallback-session-secret-for-dev";

const getOidcConfig = memoize(
  async () => {
    try {
      return await client.discovery(
        new URL(ISSUER_URL),
        REPL_ID
      );
    } catch (error) {
      console.error('OIDC discovery error:', error);
      throw new Error('Failed to initialize OIDC configuration');
    }
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  // Use memory store for development if DATABASE_URL is not available
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not found, using memory session store (not suitable for production)');
    return session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      },
    });
  }

  // Try to use PostgreSQL store if available
  try {
    const connectPg = require("connect-pg-simple");
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: 7 * 24 * 60 * 60, // 1 week in seconds
      tableName: "sessions",
    });

    return session({
      secret: SESSION_SECRET,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      },
    });
  } catch (error) {
    console.error('Failed to initialize PostgreSQL session store, using memory store:', error);
    return session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      },
    });
  }
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  try {
    await storage.upsertUser({
      replitId: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
    });
  } catch (error) {
    console.error('Error upserting user:', error);
    // Don't throw error to avoid breaking auth flow
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  try {
    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    };

    const domains = process.env.REPLIT_DOMAINS?.split(",") || [];

    if (domains.length === 0) {
      console.warn('No REPLIT_DOMAINS configured, authentication endpoints will not be set up');
      return;
    }

    for (const domain of domains) {
      const strategyName = `replitauth:${domain}`;
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
    }

    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    // Auth routes
    app.get("/api/login", (req, res, next) => {
      const domain = req.hostname;
      if (!domains.includes(domain)) {
        return res.status(400).json({ message: 'Domain not configured for authentication' });
      }

      passport.authenticate(`replitauth:${domain}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/callback", (req, res, next) => {
      const domain = req.hostname;
      passport.authenticate(`replitauth:${domain}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        try {
          const logoutUrl = client.buildEndSessionUrl(config, {
            client_id: REPL_ID,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href;
          res.redirect(logoutUrl);
        } catch (error) {
          console.error('Error building logout URL:', error);
          res.redirect('/');
        }
      });
    });

    console.log('Authentication setup completed successfully');

  } catch (error) {
    console.error('Failed to setup authentication:', error);
    // Setup basic auth routes that return errors
    app.get("/api/login", (req, res) => {
      res.status(500).json({ message: 'Authentication system not configured properly' });
    });

    app.get("/api/callback", (req, res) => {
      res.status(500).json({ message: 'Authentication system not configured properly' });
    });

    app.get("/api/logout", (req, res) => {
      res.redirect('/');
    });
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Allow API requests without authentication for development
  if (process.env.NODE_ENV === 'development' && (req.path.startsWith('/api/email') || req.path.startsWith('/api/share'))) {
    return next();
  }

  const user = req.user as any;

  // Check if user exists and session is valid (replace req.isAuthenticated() check)
  if (!user || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    console.error('Token refresh failed:', error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Simple authentication middleware for development
export const optionalAuth: RequestHandler = async (req, res, next) => {
  if (!req.user) {
    // Continue without user for development
    req.user = { id: 1, email: 'dev@example.com' }; // Default user for development
  }
  next();
};