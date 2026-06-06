import crypto from "node:crypto";
import type { Request, Response } from "express";
import type { Session } from "@supabase/supabase-js";
import type { Prisma } from "../generated/prisma/client.js";
import { env, isProduction } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

export const GENERIC_AUTH_ERROR = "Invalid credentials.";

export const AUTH_COOKIE_NAME = "aiflow_access";
export const REFRESH_COOKIE_NAME = "aiflow_refresh";
export const CSRF_COOKIE_NAME = "aiflow_csrf";

const LOGIN_WINDOW_MS = 15 * 60_000;
const LOGIN_LOCK_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 15 * 60_000;
const CAPTCHA_EMAIL_THRESHOLD = 3;
const CAPTCHA_IP_THRESHOLD = 12;
const HARD_EMAIL_THRESHOLD = 12;
const HARD_IP_THRESHOLD = 45;

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

const hashValue = (value: string | null | undefined) => {
  if (!value) return null;
  return crypto.createHash("sha256").update(`${env.SECURITY_LOG_SALT}:${value}`).digest("hex");
};

const clientIp = (req: Request) =>
  req.ip ||
  (Array.isArray(req.headers["x-forwarded-for"])
    ? req.headers["x-forwarded-for"][0]
    : req.headers["x-forwarded-for"]?.split(",")[0]?.trim()) ||
  req.socket.remoteAddress ||
  null;

const clientUserAgent = (req: Request) => {
  const value = req.headers["user-agent"];
  return typeof value === "string" ? value.slice(0, 300) : null;
};

export const emailHash = (email: string) => hashValue(normalizeEmail(email));
export const ipHash = (req: Request) => hashValue(clientIp(req));

export const logSecurityEvent = async (
  req: Request,
  event: {
    eventType: string;
    severity?: "info" | "warning" | "critical";
    userId?: string | null;
    email?: string | null;
    metadata?: Record<string, unknown>;
  }
) => {
  try {
    await prisma.securityEvent.create({
      data: {
        userId: event.userId ?? null,
        emailHash: event.email ? emailHash(event.email) : null,
        ipHash: ipHash(req),
        eventType: event.eventType,
        severity: event.severity ?? "info",
        metadata: event.metadata ? (event.metadata as Prisma.InputJsonValue) : undefined,
        userAgent: clientUserAgent(req)
      }
    });
  } catch (error) {
    console.warn("Security event logging failed.", error instanceof Error ? error.message : error);
  }
};

export const recentSecurityEventCount = async (
  where: { eventType: string; email?: string | null; req?: Request },
  windowMs = LOGIN_WINDOW_MS
) => {
  const since = new Date(Date.now() - windowMs);
  const hashes = {
    emailHash: where.email ? emailHash(where.email) : undefined,
    ipHash: where.req ? ipHash(where.req) : undefined
  };

  return prisma.securityEvent.count({
    where: {
      eventType: where.eventType,
      createdAt: { gte: since },
      OR: [
        ...(hashes.emailHash ? [{ emailHash: hashes.emailHash }] : []),
        ...(hashes.ipHash ? [{ ipHash: hashes.ipHash }] : [])
      ]
    }
  });
};

export const assessLoginRisk = async (req: Request, email: string) => {
  const since = new Date(Date.now() - LOGIN_WINDOW_MS);
  const eHash = emailHash(email);
  const iHash = ipHash(req);

  const [emailFailures, ipFailures] = await Promise.all([
    eHash
      ? prisma.securityEvent.count({
          where: { eventType: "login_failed", emailHash: eHash, createdAt: { gte: since } }
        })
      : Promise.resolve(0),
    iHash
      ? prisma.securityEvent.count({
          where: { eventType: "login_failed", ipHash: iHash, createdAt: { gte: since } }
        })
      : Promise.resolve(0)
  ]);

  return {
    emailFailures,
    ipFailures,
    captchaRequired: emailFailures >= CAPTCHA_EMAIL_THRESHOLD || ipFailures >= CAPTCHA_IP_THRESHOLD,
    temporarilyBlocked: emailFailures >= HARD_EMAIL_THRESHOLD || ipFailures >= HARD_IP_THRESHOLD
  };
};

export const verifyCaptchaToken = async (token: string | undefined, req: Request) => {
  if (!env.CAPTCHA_SECRET) return false;
  if (!token) return false;

  const body = new URLSearchParams({
    secret: env.CAPTCHA_SECRET,
    response: token
  });
  const ip = clientIp(req);
  if (ip) body.set("remoteip", ip);

  try {
    const response = await fetch(env.CAPTCHA_VERIFY_URL, {
      method: "POST",
      body,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(7_000)
    });
    const payload = (await response.json()) as { success?: boolean };
    return Boolean(response.ok && payload.success);
  } catch {
    return false;
  }
};

export const enforceCaptchaIfSuspicious = async (req: Request, email: string, captchaToken?: string) => {
  const risk = await assessLoginRisk(req, email);
  if (risk.temporarilyBlocked) {
    await logSecurityEvent(req, {
      eventType: "login_temporarily_blocked",
      severity: "critical",
      email,
      metadata: risk
    });
    throw new AppError(429, GENERIC_AUTH_ERROR);
  }

  if (!risk.captchaRequired) return;

  if (!(await verifyCaptchaToken(captchaToken, req))) {
    await logSecurityEvent(req, {
      eventType: "captcha_required",
      severity: "warning",
      email,
      metadata: {
        ...risk,
        captchaConfigured: Boolean(env.CAPTCHA_SECRET)
      }
    });
    throw new AppError(429, "Additional verification required.");
  }
};

export const recordFailedLogin = async (
  req: Request,
  params: { email: string; userId?: string | null; currentAttempts?: number; reason: string }
) => {
  const nextAttempts = (params.currentAttempts ?? 0) + 1;
  const lockedUntil = nextAttempts >= LOGIN_LOCK_ATTEMPTS ? new Date(Date.now() + LOGIN_LOCK_MS) : null;

  if (params.userId) {
    await prisma.user.update({
      where: { id: params.userId },
      data: {
        failedLoginAttempts: nextAttempts,
        lockedUntil
      },
      select: { id: true }
    });
  }

  await logSecurityEvent(req, {
    eventType: "login_failed",
    severity: lockedUntil ? "critical" : "warning",
    userId: params.userId,
    email: params.email,
    metadata: {
      reason: params.reason,
      lockApplied: Boolean(lockedUntil)
    }
  });
};

export const recordSuccessfulLogin = async (req: Request, params: { email: string; userId: string }) => {
  await prisma.user.update({
    where: { id: params.userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date()
    },
    select: { id: true }
  });

  await logSecurityEvent(req, {
    eventType: "login_success",
    userId: params.userId,
    email: params.email
  });
};

export const readCookie = (req: Request, name: string) => {
  const header = req.headers.cookie;
  if (!header) return null;

  for (const part of header.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
};

const cookieBase = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/"
};

export const setSessionCookies = (res: Response, session: Session) => {
  const csrfToken = crypto.randomBytes(32).toString("base64url");
  const accessMaxAge = Math.max(60, session.expires_in ?? 3600) * 1000;

  res.cookie(AUTH_COOKIE_NAME, session.access_token, {
    ...cookieBase,
    maxAge: accessMaxAge
  });
  res.cookie(REFRESH_COOKIE_NAME, session.refresh_token, {
    ...cookieBase,
    maxAge: 30 * 24 * 60 * 60_000
  });
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: accessMaxAge
  });

  return csrfToken;
};

export const clearSessionCookies = (res: Response) => {
  for (const name of [AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME, CSRF_COOKIE_NAME]) {
    res.clearCookie(name, {
      secure: isProduction,
      sameSite: "lax",
      path: "/"
    });
  }
};

export const enforceAccountNotLocked = (lockedUntil?: Date | null) => {
  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    throw new AppError(401, GENERIC_AUTH_ERROR);
  }
};
