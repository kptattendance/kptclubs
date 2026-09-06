import express from "express";

import {
  getStudentProfile,
  getStudentClubs,
  registerStudent,
  deleteStudent,
} from "../controllers/studentController.js";

import requireAuth from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";

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
  registerStudent
);


// =====================================================
// DELETE STUDENT
// =====================================================

router.delete(
  "/:studentId",
  requireAuth,
  resolveUser,
  deleteStudent
);

export default router;