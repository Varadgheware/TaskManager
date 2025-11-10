import sqlite3 from "sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync, mkdirSync, existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path
const DB_DIR = join(__dirname, "../../../database");
const DB_PATH = join(DB_DIR, "app.db");
const SCHEMA_PATH = join(DB_DIR, "schema.sql");

// Initialize database
let db = null;

let schemaInitialized = false;
const schemaInitPromise = null;

export function getDatabase() {
  if (!db) {
    // Ensure database directory exists
    if (!existsSync(DB_DIR)) {
      try {
        mkdirSync(DB_DIR, { recursive: true });
        console.log("Database directory created");
      } catch (err) {
        console.error("Error creating database directory:", err);
      }
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error("Error opening database:", err);
        throw err;
      } else {
        console.log("Connected to SQLite database at", DB_PATH);
        
        // Enable foreign keys
        db.run("PRAGMA foreign_keys = ON", (err) => {
          if (err) {
            console.error("Error enabling foreign keys:", err);
          }
        });
      }
    });
  }
  return db;
}

// Initialize schema and wait for completion
export async function initializeSchema() {
  if (schemaInitialized) {
    return Promise.resolve();
  }

  const database = getDatabase();
  
  // Enable foreign keys
  await new Promise((resolve, reject) => {
    database.run("PRAGMA foreign_keys = ON", (err) => {
      if (err) {
        console.error("Error enabling foreign keys:", err);
        reject(err);
      } else {
        resolve();
      }
    });
  });

  try {
    await initializeDatabase();
    schemaInitialized = true;
  } catch (err) {
    throw err;
  }
}

async function initializeDatabase() {
  try {
    if (!existsSync(SCHEMA_PATH)) {
      console.error("Schema file not found at:", SCHEMA_PATH);
      return;
    }

    // Check if users table exists and has the correct structure
    const checkTable = await new Promise((resolve) => {
      db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
        if (err || !row) {
          resolve(null);
        } else {
          resolve(row.sql);
        }
      });
    });

    // If users table exists but doesn't have password_hash column, drop all tables
    if (checkTable && !checkTable.includes("password_hash")) {
      console.log("Detected old schema, dropping existing tables...");
      await new Promise((resolve, reject) => {
        db.exec("DROP TABLE IF EXISTS updates; DROP TABLE IF EXISTS tasks; DROP TABLE IF EXISTS users;", (err) => {
          if (err) {
            console.warn("Error dropping tables:", err.message);
            // Continue anyway
          }
          resolve();
        });
      });
    }

    const schema = readFileSync(SCHEMA_PATH, "utf8");
    
    // Split by semicolon and filter out empty statements and comments
    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => {
        // Remove empty statements and full-line comments
        if (s.length === 0) return false;
        // Remove lines that are only comments
        const lines = s.split("\n").map(l => l.trim());
        const nonCommentLines = lines.filter(l => l.length > 0 && !l.startsWith("--"));
        return nonCommentLines.length > 0;
      });

    // Execute each statement sequentially
    for (const statement of statements) {
      if (statement.trim().length === 0) continue;
      
      try {
        await new Promise((resolve, reject) => {
          db.run(statement, (err) => {
            if (err) {
              // Ignore "already exists" errors (idempotent schema)
              const errMsg = err.message.toLowerCase();
              if (errMsg.includes("already exists")) {
                resolve(); // Ignore these errors
              } else {
                // For other errors, log but don't fail (might be index creation on non-existent table)
                console.warn("Schema statement warning:", err.message.substring(0, 50));
                resolve(); // Continue with next statement
              }
            } else {
              resolve();
            }
          });
        });
      } catch (err) {
        // Log but continue
        console.warn("Schema execution warning:", err.message);
      }
    }

    console.log("Database schema initialized successfully");
  } catch (err) {
    console.error("Error reading schema file:", err);
    throw err;
  }
}

// Promisified database methods
export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function getDatabasePath() {
  return DB_PATH;
}
