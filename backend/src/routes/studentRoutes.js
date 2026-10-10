import express from "express";

import {
  getStudentProfile,
  getStudentClubs,
  registerStudent,
  registerForClub,
  deleteStudent,
} from "../controllers/studentController.js";

import requireAuth from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";
import requireRole from "../middleware/roleMiddleware.js";
import { publicWriteLimiter } from "../middleware/security.js";

const router = express.Router();


// =====================================================
// GET LOGGED-IN STUDENT PROFILE
// =====================================================

router.get(
  "/profile",
  requireAuth,
  resolveUser,
  getStudentProfile
);


// =====================================================
// GET AVAILABLE CLUBS
// =====================================================

router.get(
  "/clubs",
  getStudentClubs
);


// =====================================================
// STUDENT REGISTRATION
// =====================================================

router.post(
  "/register",
  publicWriteLimiter,
  registerStudent
);

// =====================================================
// LOGGED-IN STUDENT APPLIES TO A CLUB
// =====================================================

router.post(
  "/club-registration",
  requireAuth,
  resolveUser,
  registerForClub
);


// =====================================================
// DELETE STUDENT
// =====================================================

router.delete(
  "/:studentId",
  requireAuth,
  requireRole("ADMIN"),
  deleteStudent
);

export default router;