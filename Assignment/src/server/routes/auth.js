import express from "express";
import { login } from "../services/auth.js";
import { loginLimiter } from "../middleware/rateLimit.js";
import { validateLogin, validateBodySize, validateJSON } from "../middleware/validation.js";

const router = express.Router();

// POST /login
router.post(
  "/login",
  loginLimiter,
  validateBodySize,
  validateJSON,
  validateLogin,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await login(email, password);

      res.json({
        success: true,
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message || "Login failed",
      });
    }
  }
);

export default router;

