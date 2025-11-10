import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { hashPassword, verifyPassword, login, generateToken, verifyToken } from "../services/auth.js";
import { dbRun, dbGet, getDatabase } from "../services/database.js";

describe("Authentication", () => {
  beforeAll(async () => {
    // Initialize database
    getDatabase();
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Create test user
    const passwordHash = await hashPassword("test123");
    await dbRun(
      "INSERT OR REPLACE INTO users (email, password_hash, role) VALUES (?, ?, ?)",
      ["test@example.com", passwordHash, "contributor"]
    );
  });

  afterAll(async () => {
    const db = getDatabase();
    db.close();
  });

  describe("Password Hashing", () => {
    it("should hash a password", async () => {
      const hash = await hashPassword("test123");
      expect(hash).toBeDefined();
      expect(hash).toContain(":");
    });

    it("should verify a correct password", async () => {
      const hash = await hashPassword("test123");
      const isValid = await verifyPassword("test123", hash);
      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const hash = await hashPassword("test123");
      const isValid = await verifyPassword("wrongpassword", hash);
      expect(isValid).toBe(false);
    });
  });

  describe("JWT Tokens", () => {
    it("should generate a token", () => {
      const user = { id: 1, email: "test@example.com", role: "contributor" };
      const token = generateToken(user);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });

    it("should verify a valid token", () => {
      const user = { id: 1, email: "test@example.com", role: "contributor" };
      const token = generateToken(user);
      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });

    it("should reject an invalid token", () => {
      const decoded = verifyToken("invalid-token");
      expect(decoded).toBeNull();
    });
  });

  describe("Login", () => {
    it("should login with valid credentials", async () => {
      const result = await login("test@example.com", "test123");
      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe("test@example.com");
    });

    it("should reject invalid credentials", async () => {
      try {
        await login("test@example.com", "wrongpassword");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("Invalid email or password");
      }
    });

    it("should reject non-existent user", async () => {
      try {
        await login("nonexistent@example.com", "test123");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).toContain("Invalid email or password");
      }
    });
  });
});

