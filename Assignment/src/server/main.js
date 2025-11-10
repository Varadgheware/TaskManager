import express from "express";
import dotenv from "dotenv";
import { getDatabase, initializeSchema } from "./services/database.js";
import { requestLogger } from "./middleware/logging.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import updateRoutes from "./routes/updates.js";

// Load environment variables
dotenv.config();

// Initialize database connection and schema
async function startServer() {
  try {
    getDatabase();
    await initializeSchema();
    console.log("Database initialized and ready");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
}

// Create Express app
const app = express();

// Middleware
app.use(express.json({ limit: "5kb" }));
app.use(requestLogger);
app.use(apiLimiter);

// CORS middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});

// Routes
app.use("/api", authRoutes);
app.use("/api", taskRoutes);
app.use("/api", updateRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// Start server
const PORT = process.env.PORT || 3000;

startServer().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  POST /api/login`);
    console.log(`  GET /api/tasks`);
    console.log(`  POST /api/tasks`);
    console.log(`  POST /api/updates`);
  });
});

// Handle server errors
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1);
});
