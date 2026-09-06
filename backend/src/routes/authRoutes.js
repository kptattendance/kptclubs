import express from "express";

import {
  authenticateUser,
} from "../controllers/authController.js";

const router = express.Router();

router.get(
  "/me",
  authenticateUser
);

export default router;