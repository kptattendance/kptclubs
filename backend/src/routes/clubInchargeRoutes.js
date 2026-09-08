import express from "express";

import requireAuth from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";

import {
  getClubApplications,
  approveClubApplication,
  rejectClubApplication,
  getClubStudents,
  deleteClubStudent,
} from "../controllers/clubInchargeController.js";
import { getClubAttendanceMembers, submitClubAttendance } from "../controllers/attendanceController.js";

const router = express.Router();


router.get(
  "/applications",
  requireAuth,
  resolveUser,
  getClubApplications
);


router.put(
  "/applications/:membershipId/approve",
  requireAuth,
  resolveUser,
  approveClubApplication
);


router.put(
  "/applications/:membershipId/reject",
  requireAuth,
  resolveUser,
  rejectClubApplication
);

router.get(
  "/:clubCode/students",
  requireAuth,
  resolveUser,
  getClubStudents
);

router.get(
  "/attendance/members",
  requireAuth,
  resolveUser,
  getClubAttendanceMembers
);

router.post(
  "/attendance",
  requireAuth,
  resolveUser,
  submitClubAttendance
);

router.delete(
  "/:clubCode/students/:studentId",
  requireAuth,
  resolveUser,
  deleteClubStudent
);
export default router;