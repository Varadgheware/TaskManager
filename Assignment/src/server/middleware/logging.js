// Logging middleware
export function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const duration = Date.now() - startTime;
    const user = req.user ? req.user.email : "anonymous";
    const route = req.method + " " + req.path;
    const status = res.statusCode;

    console.log(
      `[${new Date().toISOString()}] ${route} | User: ${user} | Status: ${status} | Time: ${duration}ms`
    );

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
}
