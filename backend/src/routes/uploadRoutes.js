import express from "express";

import {
  uploadProfilePhoto,
} from "../controllers/uploadController.js";

import upload from "../middleware/uploadMiddleware.js";
import { publicWriteLimiter } from "../middleware/security.js";

const router = express.Router();

// Public: students upload their photo before an account exists
router.post(
  "/profile-photo",
  publicWriteLimiter,
  upload.single("image"),
  uploadProfilePhoto
);

export default router;
