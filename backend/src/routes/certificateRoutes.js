import express from "express";

import {
  getClubCertificateStudents,
  approveCertificate,
  getStudentCertificate,
  downloadStudentCertificate,
} from "../controllers/certificateController.js";

import requireAuth from "../middleware/authMiddleware.js";
import resolveUser from "../middleware/resolveUser.js";

const router = express.Router();


// ======================================================
// CLUB IN-CHARGE
// ======================================================

router.get(
  "/club/students",
  requireAuth,
  resolveUser,
  getClubCertificateStudents
);


router.put(
  "/:certificateId/approve",
  requireAuth,
  resolveUser,
  approveCertificate
);


// ======================================================
// STUDENT
// ======================================================

router.get(
  "/student",
  requireAuth,
  resolveUser,
  getStudentCertificate
);


router.get(
  "/student/download",
  requireAuth,
  resolveUser,
  downloadStudentCertificate
);


export default router;