import { ZodError } from "zod";
import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/AppError.js";

const isPrismaError = (err: unknown) =>
  Boolean(
    err &&
      typeof err === "object" &&
      (("code" in err && typeof (err as { code?: unknown }).code === "string" && (err as { code: string }).code.startsWith("P")) ||
        ("errorCode" in err &&
          typeof (err as { errorCode?: unknown }).errorCode === "string" &&
          (err as { errorCode: string }).errorCode.startsWith("P")))
  );

const errorPayload = (_statusCode: number, message: string) => ({
  error: {
    message
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
        message: "Invalid request."
      }
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(errorPayload(err.statusCode, err.message));
  }

  if (isPrismaError(err)) {
    return res.status(503).json(errorPayload(503, "Service temporarily unavailable."));
  }

  const statusCode = typeof err?.statusCode === "number" ? err.statusCode : 500;
  return res.status(statusCode).json(
    errorPayload(statusCode, statusCode === 500 ? "Server error while processing the request." : "Request failed.")
  );
};
