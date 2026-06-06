import type { NextFunction, Request, Response } from "express";
import { env, isProduction, isSupabaseConfigured } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { supabase } from "../lib/supabase.js";
import { AUTH_COOKIE_NAME, CSRF_COOKIE_NAME, logSecurityEvent, readCookie } from "../services/security.js";
import { AppError } from "../utils/AppError.js";

export type AuthenticatedProfile = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: "FREE" | "STARTER" | "PRO" | "TEAM";
  role: "USER" | "ADMIN";
  paymentCustomerId: string | null;
  paymentSubscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionCurrentPeriodEnd: Date | null;
};

declare global {
  namespace Express {
    interface Request {
      auth?: {
        token: string;
        tokenSource: "bearer" | "cookie";
        aal: string | null;
        user: AuthenticatedProfile;
      };
    }
  }
}

export const readBearerToken = (req: Request) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
};

export const readAuthToken = (req: Request) => {
  const bearer = readBearerToken(req);
  if (bearer) return { token: bearer, source: "bearer" as const };

  const cookieToken = readCookie(req, AUTH_COOKIE_NAME);
  if (cookieToken) return { token: cookieToken, source: "cookie" as const };

  return null;
};

const readJwtPayload = (token: string) => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(normalized, "base64").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const assertCookieCsrf = (req: Request) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;

  const csrfCookie = readCookie(req, CSRF_COOKIE_NAME);
  const csrfHeader = req.headers["x-csrf-token"];
  const csrfValue = Array.isArray(csrfHeader) ? csrfHeader[0] : csrfHeader;
  if (!csrfCookie || !csrfValue || csrfCookie !== csrfValue) {
    throw new AppError(403, "Invalid request.");
  }
};

const authProfileSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  plan: true,
  role: true,
  paymentCustomerId: true,
  paymentSubscriptionId: true,
  subscriptionStatus: true,
  subscriptionCurrentPeriodEnd: true
} as const;

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  let stage = "reading the auth token";

  try {
    const authToken = readAuthToken(req);
    if (!authToken) {
      throw new AppError(401, "Authentication required.");
    }
    const { token } = authToken;
    if (authToken.source === "cookie") assertCookieCsrf(req);

    if (!isSupabaseConfigured || !supabase) {
      if (!isProduction && env.NODE_ENV === "development" && token === "dev-token") {
        const user = await prisma.user.upsert({
          where: { id: "00000000-0000-0000-0000-000000000001" },
          create: {
            id: "00000000-0000-0000-0000-000000000001",
            email: "dev@aiflow.local",
            name: "AIFlow Dev",
            plan: "FREE"
          },
          update: {},
          select: authProfileSelect
        });
        req.auth = {
          token,
          tokenSource: authToken.source,
          aal: "aal1",
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            plan: user.plan,
            role: user.role,
            paymentCustomerId: user.paymentCustomerId,
            paymentSubscriptionId: user.paymentSubscriptionId,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd
          }
        };
        return next();
      }

      throw new AppError(503, "Supabase is not configured on the server.");
    }

    stage = "validating the Supabase session";
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.email) {
      throw new AppError(401, "Invalid or expired session.");
    }
    if (!data.user.email_confirmed_at) {
      throw new AppError(403, "Invalid or expired session.");
    }

    stage = "syncing your AIFlow profile";
    const metadata = data.user.user_metadata ?? {};
    const existingProfile = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: { name: true }
    });

    const profile = await prisma.user.upsert({
      where: { id: data.user.id },
      create: {
        id: data.user.id,
        email: data.user.email,
        name: null,
        avatarUrl: metadata.avatar_url ?? metadata.picture ?? null,
        plan: "FREE",
        role: "USER"
      },
      update: {
        email: data.user.email,
        name: existingProfile?.name ?? undefined,
        avatarUrl: metadata.avatar_url ?? metadata.picture ?? undefined
      },
      select: authProfileSelect
    });

    const jwtPayload = readJwtPayload(token);

    req.auth = {
      token,
      tokenSource: authToken.source,
      aal: typeof jwtPayload?.aal === "string" ? String(jwtPayload.aal) : null,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        plan: profile.plan,
        role: profile.role,
        paymentCustomerId: profile.paymentCustomerId,
        paymentSubscriptionId: profile.paymentSubscriptionId,
        subscriptionStatus: profile.subscriptionStatus,
        subscriptionCurrentPeriodEnd: profile.subscriptionCurrentPeriodEnd
      }
    };
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    console.error(`Authentication failed while ${stage}`, error);
    next(
      new AppError(500, "Authentication failed.", {
        stage,
        cause: error instanceof Error ? error.message : String(error)
      })
    );
  }
};

export const requireRole =
  (...allowedRoles: AuthenticatedProfile["role"][]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(new AppError(401, "Authentication required."));
      return;
    }

    if (!allowedRoles.includes(req.auth.user.role)) {
      next(new AppError(403, "Forbidden."));
      return;
    }

    next();
  };

export const requireMfaForSensitiveAction = async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.auth) {
    next(new AppError(401, "Authentication required."));
    return;
  }

  if (!isSupabaseConfigured || !supabase) {
    next();
    return;
  }

  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(req.auth.token);
    if (error) throw error;

    if (data.nextLevel === "aal2" && data.currentLevel !== "aal2") {
      await logSecurityEvent(req, {
        eventType: "mfa_required_for_sensitive_action",
        severity: "warning",
        userId: req.auth.user.id
      });
      next(new AppError(403, "MFA verification required."));
      return;
    }

    next();
  } catch (error) {
    console.warn("MFA assurance check failed.", error instanceof Error ? error.message : error);
    next(new AppError(403, "MFA verification required."));
  }
};
