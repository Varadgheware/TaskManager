import { dbRun, dbGet, getDatabase, initializeSchema, getDatabasePath } from "../src/server/services/database.js";
import crypto from "crypto";
import { unlinkSync, existsSync } from "fs";

// Helper to hash password using crypto.scrypt
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ":" + derivedKey.toString("hex"));
    });
  });
}

// Helper to verify password
async function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString("hex"));
    });
  });
}

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Delete existing database file if it exists (to start fresh)
    // Note: We need to import the path directly since getDatabasePath requires db to be initialized
    const { join, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const dbPath = join(__dirname, "app.db");
    
    if (existsSync(dbPath)) {
      try {
        // Delete the file directly (it will be recreated)
        unlinkSync(dbPath);
        console.log("Deleted existing database file");
      } catch (err) {
        console.warn("Could not delete database file (might be in use):", err.message);
        console.log("If you see errors, please close any running servers and try again.");
        console.log("Continuing with existing database...");
      }
    }

    // Initialize database connection and schema (this will create a new database if deleted)
    getDatabase();
    await initializeSchema();
    
    console.log("Database schema ready, starting to seed data...");

    // Create users
    const viewerPassword = await hashPassword("viewer123");
    const contributorPassword = await hashPassword("contributor123");
    const moderatorPassword = await hashPassword("moderator123");

    // Insert users
    const viewerResult = await dbRun(
      `INSERT OR IGNORE INTO users (email, password_hash, role) VALUES (?, ?, ?)`,
      ["viewer@example.com", viewerPassword, "viewer"]
    );

    const contributorResult = await dbRun(
      `INSERT OR IGNORE INTO users (email, password_hash, role) VALUES (?, ?, ?)`,
      ["contributor@example.com", contributorPassword, "contributor"]
    );

    const moderatorResult = await dbRun(
      `INSERT OR IGNORE INTO users (email, password_hash, role) VALUES (?, ?, ?)`,
      ["moderator@example.com", moderatorPassword, "moderator"]
    );

    // Get user IDs
    const viewer = await dbGet("SELECT id FROM users WHERE email = ?", [
      "viewer@example.com",
    ]);
    const contributor = await dbGet("SELECT id FROM users WHERE email = ?", [
      "contributor@example.com",
    ]);
    const moderator = await dbGet("SELECT id FROM users WHERE email = ?", [
      "moderator@example.com",
    ]);

    if (!viewer || !contributor || !moderator) {
      throw new Error("Failed to create users");
    }

    console.log("Users created:", {
      viewer: viewer.id,
      contributor: contributor.id,
      moderator: moderator.id,
    });

    // Create tasks
    const task1Result = await dbRun(
      `INSERT OR IGNORE INTO tasks (title, status, assignee_id, creator_id) VALUES (?, ?, ?, ?)`,
      ["Setup project structure", "to do", contributor.id, contributor.id]
    );

    const task2Result = await dbRun(
      `INSERT OR IGNORE INTO tasks (title, status, assignee_id, creator_id) VALUES (?, ?, ?, ?)`,
      ["Implement authentication", "in progress", moderator.id, moderator.id]
    );

    // Get task IDs
    const task1 = await dbGet(
      "SELECT id FROM tasks WHERE title = ?",
      ["Setup project structure"]
    );
    const task2 = await dbGet("SELECT id FROM tasks WHERE title = ?", [
      "Implement authentication",
    ]);

    if (!task1 || !task2) {
      throw new Error("Failed to create tasks");
    }

    console.log("Tasks created:", { task1: task1.id, task2: task2.id });

    // Create updates for task 1
    await dbRun(
      `INSERT OR IGNORE INTO updates (task_id, author_id, message) VALUES (?, ?, ?)`,
      [task1.id, contributor.id, "Initial setup completed"]
    );

    await dbRun(
      `INSERT OR IGNORE INTO updates (task_id, author_id, message) VALUES (?, ?, ?)`,
      [task1.id, moderator.id, "Reviewing the setup"]
    );

    // Create updates for task 2
    await dbRun(
      `INSERT OR IGNORE INTO updates (task_id, author_id, message) VALUES (?, ?, ?)`,
      [task2.id, moderator.id, "Starting authentication implementation"]
    );

    await dbRun(
      `INSERT OR IGNORE INTO updates (task_id, author_id, message) VALUES (?, ?, ?)`,
      [task2.id, moderator.id, "JWT tokens implemented"]
    );

    console.log("Database seeded successfully!");
    console.log("\nTest users:");
    console.log("Viewer: viewer@example.com / viewer123");
    console.log("Contributor: contributor@example.com / contributor123");
    console.log("Moderator: moderator@example.com / moderator123");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    // Close database connection
    const db = getDatabase();
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err);
      } else {
        console.log("Database connection closed");
      }
      process.exit(0);
    });
  }
}

seedDatabase();

