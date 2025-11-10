import { dbAll } from "../services/database.js";

// Simple route to get all users
export async function handleGetUsers(req, res) {
  try {
    const users = await dbAll("SELECT id, username, email, created_at FROM users");
    sendJSON(res, 200, { success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    sendJSON(res, 500, { success: false, error: "Internal server error" });
  }
}

// Helper function to send JSON response
function sendJSON(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(data));
}

// Route definitions
export const routes = [
  { method: "GET", path: /^\/api\/users$/, handler: handleGetUsers },
];

