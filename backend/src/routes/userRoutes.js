import express from "express";

import requireAuth from "../middleware/authMiddleware.js";
import requireRole from "../middleware/roleMiddleware.js";

import {
  createUser,
  getCurrentUser,
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Current user
|--------------------------------------------------------------------------
*/

router.get(
  "/me",
  requireAuth,
  getCurrentUser
);


/*
|--------------------------------------------------------------------------
| Admin CRUD
|--------------------------------------------------------------------------
*/

// Create HOD / In-charge / Officer / Admin etc.
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  createUser
);

// Get all users
router.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  getUsers
);

// Get one user
router.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  getUserById
);

// Update user
router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  updateUser
);

// Activate/deactivate
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN"),
  updateUserStatus
);

// Deactivate
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  deleteUser
);

export default router;