dotenv.config();
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";

import connectDB from "./config/db.js";

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

const app = express();

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(clerkMiddleware());

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

app.use("/api/uploads", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/club-incharge", clubInchargeRoutes);
app.use(  "/api/hod",  hodRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/certificates", certificateRoutes);
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