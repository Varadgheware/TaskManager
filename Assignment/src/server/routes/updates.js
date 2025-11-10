import express from "express";
import { dbRun, dbGet, dbAll } from "../services/database.js";
import { authenticate } from "../middleware/auth.js";
import { validateUpdate, validateBodySize, validateJSON } from "../middleware/validation.js";
import { canAccessTask } from "../middleware/auth.js";

const router = express.Router();

// POST /updates - Add an update to a task (all logged-in users)
router.post(
  "/updates",
  authenticate,
  validateBodySize,
  validateJSON,
  validateUpdate,
  canAccessTask,
  async (req, res) => {
    try {
      const { task_id, message } = req.body;
      const author_id = req.user.id;

      // Verify task exists
      const task = await dbGet("SELECT * FROM tasks WHERE id = ?", [task_id]);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: "Task not found",
        });
      }

      const result = await dbRun(
        `INSERT INTO updates (task_id, author_id, message) VALUES (?, ?, ?)`,
        [task_id, author_id, message]
      );

      const update = await dbGet(
        `
        SELECT u.*, usr.email as author_email
        FROM updates u
        LEFT JOIN users usr ON u.author_id = usr.id
        WHERE u.id = ?
      `,
        [result.lastID]
      );

      res.status(201).json({
        success: true,
        data: update,
      });
    } catch (error) {
      console.error("Error creating update:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
);

export default router;

