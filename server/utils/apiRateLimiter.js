import { rateLimit } from "express-rate-limit";

export function shouldSkipLocalApiLimit(request, environment) {
  const address = request.socket?.remoteAddress;
  return environment === "development" &&
    ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address);
}

export function createApiLimiter(environment = process.env.NODE_ENV || "development") {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    // Only local development traffic bypasses the shared API budget.
    // Login, registration and AI still have their own rate limits.
    skip: (request) => shouldSkipLocalApiLimit(request, environment),
    message: { message: "Qua nhieu yeu cau. Vui long thu lai sau." },
  });
}
