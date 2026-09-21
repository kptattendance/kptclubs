import express from "express";

import {
  getAdminRegistrationSummary,
} from "../controllers/adminController.js";

const router = express.Router();

router.get(
  "/registration-summary",
  getAdminRegistrationSummary
);

export default router;