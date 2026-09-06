import express from "express";

import requireAuth from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";

import {
  getHODApplications,
  approveHODApplication,
  rejectHODApplication,
  getHODDashboard,
  getHODDepartmentStudents,
} from "../controllers/hodController.js";

const router = express.Router();


// GET pending HOD applications

router.get(
  "/applications",
  requireAuth,
  resolveUser,
  getHODApplications
);
router.get(
  "/dashboard",
  requireAuth,
  resolveUser,
  getHODDashboard
);

// APPROVE

router.put(
  "/applications/:membershipId/approve",
  requireAuth,
  resolveUser,
  approveHODApplication
);
router.get(
  "/department/students",
  requireAuth,
  resolveUser,
  getHODDepartmentStudents
);


// REJECT

router.put(
  "/applications/:membershipId/reject",
  requireAuth,
  resolveUser,
  rejectHODApplication
);


export default router;