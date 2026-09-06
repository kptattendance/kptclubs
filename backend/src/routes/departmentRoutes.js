import express from "express";

import {
  getDepartments,
  getActiveDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentController.js";

import requireAuth from "../middleware/authMiddleware.js";
import requireRole from "../middleware/roleMiddleware.js";

const router = express.Router();


// Get all departments
router.get(
  "/",
  // requireAuth,
  getDepartments
);


// Get active departments
router.get(
  "/active",
  requireAuth,
  getActiveDepartments
);


// Get department by ID
router.get(
  "/:id",
  requireAuth,
  getDepartmentById
);


// Create department
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  createDepartment
);


// Update department
router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  updateDepartment
);


// Delete department
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  deleteDepartment
);


export default router;