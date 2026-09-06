import express from "express";

import {
  getClubs,
  getActiveClubs,
  getClubsByType,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
  getClubDashboard,
} from "../controllers/clubController.js";

import requireAuth from "../middleware/authMiddleware.js";
import requireRole from "../middleware/roleMiddleware.js";

const router = express.Router();


// Get all clubs
router.get(
  "/",
  // requireAuth,
  getClubs
);

router.get(
  "/dashboard",
  requireAuth,
  requireRole(
    "CLUB_INCHARGE",
    "CLUB_OFFICER"
  ),
  getClubDashboard
);

// Get active clubs
router.get(
  "/active",
  requireAuth,
  getActiveClubs
);


// Get clubs by type
router.get(
  "/type/:type",
  requireAuth,
  getClubsByType
);


// Get club by ID
router.get(
  "/:id",
  requireAuth,
  getClubById
);


// Create club
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  createClub
);


// Update club
router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  updateClub
);


// Delete club
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  deleteClub
);


export default router;