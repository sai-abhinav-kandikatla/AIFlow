import type { Request, Response, NextFunction } from "express";

/**
 * Strips all HTML/XML tag-like structures to prevent raw HTML/XSS injection.
 */
export function sanitizeHTML(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Recursively traverses an object/array and sanitizes all string values.
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeHTML(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  if (typeof obj === "object") {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = sanitizeObject((obj as any)[key]);
    }
    return result;
  }

  return obj;
}

/**
 * Middleware that automatically sanitizes all fields in req.body.
 */
export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
}
