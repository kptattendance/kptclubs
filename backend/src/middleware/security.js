import { getAuth } from "@clerk/express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";

// --------------------------------------------------
// CORS
// --------------------------------------------------

const DEFAULT_ORIGINS = [
  "https://clubs.kptmangaluru.in",
  "https://www.clubs.kptmangaluru.in",
  "https://local.clubs.kptmangaluru.in",
  "http://localhost:3000",
];

// FRONTEND_URL may hold several comma separated origins
const envOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

export const allowedOrigins = new Set([
  ...DEFAULT_ORIGINS,
  ...envOrigins,
]);

export const corsOptions = {
  origin: (origin, callback) => {
    // Requests without an Origin header (curl, health checks)
    // are not browser cross-origin requests.
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
};

// --------------------------------------------------
// Rate limiting
//
// Many students share one college IP address, so signed-in
// requests are counted per user and the IP limits are generous.
// --------------------------------------------------

const limitResponse = {
  success: false,
  message: "Too many requests. Please try again in a few minutes.",
};

const userOrIpKey = (req) => {
  try {
    const { userId } = getAuth(req);

    if (userId) {
      return `user:${userId}`;
    }
  } catch {
    // Fall back to the IP address
  }

  return ipKeyGenerator(req.ip);
};

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  keyGenerator: userOrIpKey,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: limitResponse,
});

// Public endpoints: student registration and photo upload
export const publicWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: limitResponse,
});

// --------------------------------------------------
// NoSQL injection guard
//
// Rejects any request whose body, query or params contain
// a MongoDB operator key such as {"$ne": null}.
// --------------------------------------------------

const hasOperatorKey = (value, depth = 0) => {
  if (!value || typeof value !== "object" || depth > 8) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasOperatorKey(item, depth + 1));
  }

  return Object.keys(value).some(
    (key) =>
      key.startsWith("$") ||
      hasOperatorKey(value[key], depth + 1)
  );
};

export const rejectOperatorKeys = (req, res, next) => {
  if (
    hasOperatorKey(req.body) ||
    hasOperatorKey(req.query) ||
    hasOperatorKey(req.params)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid request data",
    });
  }

  next();
};
