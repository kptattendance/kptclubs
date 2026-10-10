import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import { clerkMiddleware } from "@clerk/express";

import connectDB from "./config/db.js";
import {
  corsOptions,
  apiLimiter,
  rejectOperatorKeys,
} from "./middleware/security.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import clubRoutes from "./routes/clubRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import hodRoutes from "./routes/hodRoutes.js";
import clubInchargeRoutes from "./routes/clubInchargeRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
const app = express();

// --------------------------------------------------
// Middleware
// --------------------------------------------------

// Behind the hosting proxy: needed for correct client IPs
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  helmet({
    // This is a JSON API consumed by the frontend on another origin
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(cors(corsOptions));
app.use(express.json({ limit: "200kb" }));
app.use(rejectOperatorKeys);

app.use(clerkMiddleware());
app.use("/api", apiLimiter);

// --------------------------------------------------
// Test route
// --------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "KPT Club Management API is running",
  });
});

// --------------------------------------------------
// API routes
// --------------------------------------------------

app.use("/api/admin", adminRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/club-incharge", clubInchargeRoutes);
app.use("/api/hod", hodRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/certificates", certificateRoutes);

// --------------------------------------------------
// 404 + error handling
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Photo must be smaller than 5 MB"
          : "Invalid file upload",
    });
  }

  if (error?.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request is too large",
    });
  }

  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in request",
    });
  }

  // Malformed ObjectId in a URL or query string
  if (error?.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID",
    });
  }

  console.error("Unhandled error:", error);

  return res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

const PORT = process.env.PORT || 5000;


const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
