import express from "express";

import {
  getClubAttendanceMembers,
  submitClubAttendance,
  viewAttendance,
  getConsolidatedAttendance,
  getStudentAttendance,
} from "../controllers/attendanceController.js";

import requireAuth from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";

const router = express.Router();

/* =====================================================
   CLUB IN-CHARGE
   ===================================================== */

router.get(
  "/members",
  requireAuth,
  resolveUser,
  getClubAttendanceMembers
);

router.post(
  "/",
  requireAuth,
  resolveUser,
  submitClubAttendance
);

/* =====================================================
   HOD / ADMIN / PRINCIPAL
   ===================================================== */

router.get(
  "/view",
  requireAuth,
  resolveUser,
  viewAttendance
);

router.get(
  "/consolidated",
  requireAuth,
  resolveUser,
  getConsolidatedAttendance
);

/* =====================================================
   STUDENT
   ===================================================== */

router.get(
  "/student",
  requireAuth,
  resolveUser,
  getStudentAttendance
);

export default router;