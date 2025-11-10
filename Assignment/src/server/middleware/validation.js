// Validation middleware
const MAX_BODY_SIZE = 5 * 1024; // 5KB

export function validateBodySize(req, res, next) {
  const contentLength = parseInt(req.headers["content-length"] || "0");

  if (contentLength > MAX_BODY_SIZE) {
    return res.status(400).json({ error: "Request body too large (max 5KB)" });
  }

  next();
}

export function validateJSON(req, res, next) {
  if (req.headers["content-type"] && !req.headers["content-type"].includes("application/json")) {
    return res.status(400).json({ error: "Invalid content type. Expected application/json" });
  }

  next();
}

// Validate login request
export function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid data format" });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  next();
}

// Validate task creation
export function validateTask(req, res, next) {
  const { title, status, assignee_id } = req.body;

  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Title is required and must be a string" });
  }

  if (title.trim().length === 0) {
    return res.status(400).json({ error: "Title cannot be empty" });
  }

  const validStatuses = ["to do", "in progress", "done"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
  }

  if (assignee_id && (typeof assignee_id !== "number" && typeof assignee_id !== "string")) {
    return res.status(400).json({ error: "Invalid assignee_id format" });
  }

  next();
}

// Validate update creation
export function validateUpdate(req, res, next) {
  const { task_id, message } = req.body;

  if (!task_id) {
    return res.status(400).json({ error: "task_id is required" });
  }

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required and must be a string" });
  }

  if (message.trim().length === 0) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  next();
}

