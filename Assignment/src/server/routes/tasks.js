import express from "express";
import { dbAll, dbGet, dbRun } from "../services/database.js";
import { authenticate, authorize, canAccessTask } from "../middleware/auth.js";
import { validateTask, validateBodySize, validateJSON } from "../middleware/validation.js";

const router = express.Router();

// GET /tasks - Get all visible tasks based on role
router.get("/tasks", authenticate, async (req, res) => {
  try {
    const user = req.user;
    let tasks;

    if (user.role === "moderator") {
      // Moderator can see all tasks
      tasks = await dbAll(`
        SELECT t.*, 
               u1.email as creator_email,
               u2.email as assignee_email
        FROM tasks t
        LEFT JOIN users u1 ON t.creator_id = u1.id
        LEFT JOIN users u2 ON t.assignee_id = u2.id
        ORDER BY t.created_at DESC
      `);
    } else if (user.role === "contributor") {
      // Contributor can see tasks they created or are assigned to
      tasks = await dbAll(
        `
        SELECT t.*, 
               u1.email as creator_email,
               u2.email as assignee_email
        FROM tasks t
        LEFT JOIN users u1 ON t.creator_id = u1.id
        LEFT JOIN users u2 ON t.assignee_id = u2.id
        WHERE t.creator_id = ? OR t.assignee_id = ?
        ORDER BY t.created_at DESC
      `,
        [user.id, user.id]
      );
    } else {
      // Viewer can only see tasks assigned to them
      tasks = await dbAll(
        `
        SELECT t.*, 
               u1.email as creator_email,
               u2.email as assignee_email
        FROM tasks t
        LEFT JOIN users u1 ON t.creator_id = u1.id
        LEFT JOIN users u2 ON t.assignee_id = u2.id
        WHERE t.assignee_id = ?
        ORDER BY t.created_at DESC
      `,
        [user.id]
      );
    }

    // Get updates for each task
    const tasksWithUpdates = await Promise.all(
      tasks.map(async (task) => {
        const updates = await dbAll(
          `
          SELECT u.*, usr.email as author_email
          FROM updates u
          LEFT JOIN users usr ON u.author_id = usr.id
          WHERE u.task_id = ?
          ORDER BY u.created_at DESC
        `,
          [task.id]
        );

        // Get last update
        const lastUpdate = updates.length > 0 ? updates[0] : null;

        return {
          ...task,
          updates,
          last_update: lastUpdate,
        };
      })
    );

    res.json({
      success: true,
      data: tasksWithUpdates,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST /tasks - Create a new task (contributor & moderator only)
router.post(
  "/tasks",
  authenticate,
  authorize("contributor", "moderator"),
  validateBodySize,
  validateJSON,
  validateTask,
  async (req, res) => {
    try {
      const { title, status = "to do", assignee_id } = req.body;
      const creator_id = req.user.id;

      const result = await dbRun(
        `INSERT INTO tasks (title, status, assignee_id, creator_id) VALUES (?, ?, ?, ?)`,
        [title, status, assignee_id || null, creator_id]
      );

      const task = await dbGet("SELECT * FROM tasks WHERE id = ?", [result.lastID]);

      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
);

export default router;
