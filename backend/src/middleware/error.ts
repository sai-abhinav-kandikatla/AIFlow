import { ZodError } from "zod";
import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/AppError.js";
import { isProduction } from "../config/env.js";

const isPrismaError = (err: unknown) =>
  Boolean(
    err &&
      typeof err === "object" &&
      (("code" in err && typeof (err as { code?: unknown }).code === "string" && (err as { code: string }).code.startsWith("P")) ||
        ("errorCode" in err &&
          typeof (err as { errorCode?: unknown }).errorCode === "string" &&
          (err as { errorCode: string }).errorCode.startsWith("P")))
  );

const sanitizeErrorMessage = (value: unknown) => {
  const message = value instanceof Error ? value.message : String(value ?? "Unknown server error");

  return message
    .replace(/postgresql:\/\/[^\s"']+/gi, "postgresql://[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .replace(/AIza[0-9A-Za-z_-]+/g, "[redacted-api-key]")
    .slice(0, 260);
};

const errorPayload = (statusCode: number, message: string, details?: unknown) => ({
  error: {
    message,
    ...(!isProduction || statusCode < 500 ? { details } : {})
  }
});

export const notFound: ErrorRequestHandler = (err, _req, res, _next) => {
  res.status(404).json({
    error: {
      message: err?.message ?? "Not found"
    }
  });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err) {
    console.error("Request failed", err);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Validation failed.",
        details: err.flatten()
      }
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(errorPayload(err.statusCode, err.message, err.details));
  }

  if (isPrismaError(err)) {
    return res
      .status(503)
      .json(
        errorPayload(
          503,
          "Database request failed. Check the Supabase DATABASE_URL/DIRECT_URL values and make sure migrations were applied.",
          {
            cause: sanitizeErrorMessage(err)
          }
        )
      );
  }

  const statusCode = typeof err?.statusCode === "number" ? err.statusCode : 500;
  return res.status(statusCode).json(
    errorPayload(statusCode, statusCode === 500 ? "Server error while processing the request." : err.message, {
      cause: statusCode === 500 ? sanitizeErrorMessage(err) : err?.stack
    })
  );
};
