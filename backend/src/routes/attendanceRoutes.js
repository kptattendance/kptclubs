import express from "express";

import {
  getClubAttendanceMembers,
  submitClubAttendance,
  viewAttendance,
  getConsolidatedAttendance,
  getStudentAttendance,
  getClubAttendanceDetails,
  getAdminAttendanceStatus,
} from "../controllers/attendanceController.js";

import requireAuth from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";
import requireRole from "../middleware/roleMiddleware.js";

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
  "/attendance-status",
  requireAuth,
  requireRole("ADMIN"),
  getAdminAttendanceStatus
); 
router.get(
  "/student",
  requireAuth,
  resolveUser,
  getStudentAttendance
);

router.get(
  "/club-details",
  requireAuth,
  resolveUser,
  getClubAttendanceDetails
);

export default router;