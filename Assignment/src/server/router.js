import { routes } from "./routes/index.js";

export function handleRequest(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Parse URL path
  const url = req.url.split("?")[0]; // Remove query string
  const path = url;

  for (const route of routes) {
    if (route.method === req.method && route.path.test(path)) {
      // Handle async route handlers
      const result = route.handler(req, res);
      if (result && typeof result.catch === "function") {
        result.catch((err) => {
          console.error("Unhandled error in route handler:", err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: "Internal server error" }));
          }
        });
      }
      return;
    }
  }

  // No route found
  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ success: false, error: "Not found" }));
}
