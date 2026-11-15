
import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskAnalytics
} from "../controllers/taskController.js";

const router = express.Router();

// All routes below require authentication
router.use(protect);

// Create task
router.post("/", createTask);

// Get task analytics
router.get("/analytics", getTaskAnalytics);

// Get all tasks with filters and pagination
router.get("/", getTasks);

// Get individual task
router.get("/:id", getTaskById);

// Update task
router.patch("/:id", updateTask);

// Delete task
router.delete("/:id", deleteTask);

export default router;
