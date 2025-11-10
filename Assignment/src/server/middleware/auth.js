import { verifyToken, getUserById } from "../services/auth.js";
import { dbGet } from "../services/database.js";

// Authentication middleware
export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

// Role-based authorization middleware
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}

// Check if user can access task (viewer: only their tasks, contributor: tasks they created/assigned, moderator: all)
export async function canAccessTask(req, res, next) {
  try {
    const taskId = req.params.id || req.body.task_id;

    if (!taskId) {
      return next(); // Let the route handle missing task_id
    }

    const task = await dbGet("SELECT * FROM tasks WHERE id = ?", [taskId]);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const user = req.user;

    // Moderator can access all tasks
    if (user.role === "moderator") {
      return next();
    }

    // Contributor can access tasks they created or are assigned to
    if (user.role === "contributor") {
      if (task.creator_id == user.id || task.assignee_id == user.id) {
        return next();
      }
      return res.status(403).json({ error: "Forbidden" });
    }

    // Viewer can only access tasks assigned to them
    if (user.role === "viewer") {
      if (task.assignee_id == user.id) {
        return next();
      }
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.status(403).json({ error: "Forbidden" });
  } catch (error) {
    console.error("Error in canAccessTask middleware:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

