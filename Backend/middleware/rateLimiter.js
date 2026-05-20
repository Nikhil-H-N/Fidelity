const buckets = new Map();

const CLEANUP_INTERVAL_MS = 60_000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}, CLEANUP_INTERVAL_MS);

const createRateLimiter = ({ windowMs = 60_000, max = 120, label = "global" } = {}) => {
  return (req, res, next) => {
    const now = Date.now();

    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "unknown";
    const key = `${label}:${ip}`;
    const current = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (current.resetAt <= now) {
      current.count = 0;
      current.resetAt = now + windowMs;
    }

    current.count += 1;
    buckets.set(key, current);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - current.count));
    res.setHeader("X-RateLimit-Reset", new Date(current.resetAt).toISOString());

    if (current.count > max) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please slow down and try again shortly.",
      });
    }

    next();
  };
};

module.exports = createRateLimiter;
