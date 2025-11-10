import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { dbRun, dbGet, dbAll, getDatabase } from "../services/database.js";
import { hashPassword } from "../services/auth.js";

describe("Tasks", () => {
  let testUserId;
  let testTaskId;

  beforeAll(async () => {
    // Initialize database
    getDatabase();
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Create test user
    const passwordHash = await hashPassword("test123");
    const userResult = await dbRun(
      "INSERT OR REPLACE INTO users (email, password_hash, role) VALUES (?, ?, ?)",
      ["test@example.com", passwordHash, "contributor"]
    );

    const user = await dbGet("SELECT id FROM users WHERE email = ?", ["test@example.com"]);
    testUserId = user.id;

    // Create test task
    const taskResult = await dbRun(
      "INSERT OR REPLACE INTO tasks (title, status, creator_id) VALUES (?, ?, ?)",
      ["Test Task", "to do", testUserId]
    );

    const task = await dbGet("SELECT id FROM tasks WHERE title = ?", ["Test Task"]);
    testTaskId = task.id;
  });

  afterAll(async () => {
    const db = getDatabase();
    db.close();
  });

  describe("Task Creation", () => {
    it("should create a task", async () => {
      const result = await dbRun(
        "INSERT INTO tasks (title, status, creator_id) VALUES (?, ?, ?)",
        ["New Task", "to do", testUserId]
      );

      expect(result.lastID).toBeDefined();

      const task = await dbGet("SELECT * FROM tasks WHERE id = ?", [result.lastID]);
      expect(task).toBeDefined();
      expect(task.title).toBe("New Task");
      expect(task.status).toBe("to do");
      expect(task.creator_id).toBe(testUserId);
    });
  });

  describe("Task Retrieval", () => {
    it("should retrieve a task by ID", async () => {
      const task = await dbGet("SELECT * FROM tasks WHERE id = ?", [testTaskId]);
      expect(task).toBeDefined();
      expect(task.title).toBe("Test Task");
    });

    it("should retrieve all tasks for a user", async () => {
      const tasks = await dbAll(
        "SELECT * FROM tasks WHERE creator_id = ?",
        [testUserId]
      );
      expect(tasks).toBeDefined();
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
    });

    it("should filter tasks by status", async () => {
      const tasks = await dbAll(
        "SELECT * FROM tasks WHERE status = ?",
        ["to do"]
      );
      expect(tasks).toBeDefined();
      expect(Array.isArray(tasks)).toBe(true);
      tasks.forEach((task) => {
        expect(task.status).toBe("to do");
      });
    });
  });

  describe("Task Updates", () => {
    it("should create an update for a task", async () => {
      const result = await dbRun(
        "INSERT INTO updates (task_id, author_id, message) VALUES (?, ?, ?)",
        [testTaskId, testUserId, "Test update message"]
      );

      expect(result.lastID).toBeDefined();

      const update = await dbGet("SELECT * FROM updates WHERE id = ?", [result.lastID]);
      expect(update).toBeDefined();
      expect(update.task_id).toBe(testTaskId);
      expect(update.author_id).toBe(testUserId);
      expect(update.message).toBe("Test update message");
    });

    it("should retrieve updates for a task", async () => {
      const updates = await dbAll(
        "SELECT * FROM updates WHERE task_id = ? ORDER BY created_at DESC",
        [testTaskId]
      );
      expect(updates).toBeDefined();
      expect(Array.isArray(updates)).toBe(true);
    });
  });
});

