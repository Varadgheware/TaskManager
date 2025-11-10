import crypto from "crypto";
import jwt from "jsonwebtoken";
import { dbGet, dbRun } from "./database.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "30m";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// Store login attempts in memory (in production, use Redis or database)
const loginAttempts = new Map();

// Hash password using crypto.scrypt
export async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ":" + derivedKey.toString("hex"));
    });
  });
}

// Verify password
export async function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString("hex"));
    });
  });
}

// Check if account is locked
export function isAccountLocked(email) {
  const attempts = loginAttempts.get(email);
  if (!attempts) return false;

  if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
    return true;
  }

  // Clear lock if expired
  if (attempts.lockedUntil && attempts.lockedUntil <= Date.now()) {
    loginAttempts.delete(email);
    return false;
  }

  return false;
}

// Record failed login attempt
export function recordFailedLogin(email) {
  const attempts = loginAttempts.get(email) || { count: 0 };

  attempts.count += 1;
  attempts.lastAttempt = Date.now();

  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_DURATION;
    attempts.count = 0; // Reset counter after lockout
  }

  loginAttempts.set(email, attempts);
}

// Clear login attempts on successful login
export function clearLoginAttempts(email) {
  loginAttempts.delete(email);
}

// Generate JWT token
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Login function
export async function login(email, password) {
  // Check if account is locked
  if (isAccountLocked(email)) {
    const attempts = loginAttempts.get(email);
    const lockoutRemaining = Math.ceil((attempts.lockedUntil - Date.now()) / 1000 / 60);
    throw new Error(`Account locked. Try again in ${lockoutRemaining} minutes.`);
  }

  // Get user from database
  const user = await dbGet("SELECT * FROM users WHERE email = ?", [email]);

  if (!user) {
    recordFailedLogin(email);
    throw new Error("Invalid email or password");
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    recordFailedLogin(email);
    throw new Error("Invalid email or password");
  }

  // Clear login attempts on success
  clearLoginAttempts(email);

  // Generate token (rotate on each login)
  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

// Get user by ID
export async function getUserById(id) {
  return await dbGet("SELECT id, email, role, created_at FROM users WHERE id = ?", [id]);
}
