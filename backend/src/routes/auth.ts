import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { env, isSupabaseConfigured } from "../config/env.js";
import { readAuthToken, requireAuth, requireMfaForSensitiveAction } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { supabase, supabaseAdmin } from "../lib/supabase.js";
import {
  clearSessionCookies,
  enforceAccountNotLocked,
  enforceCaptchaIfSuspicious,
  GENERIC_AUTH_ERROR,
  logSecurityEvent,
  normalizeEmail,
  recordFailedLogin,
  recordSuccessfulLogin,
  setSessionCookies
} from "../services/security.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120).optional(),
  captcha_token: z.string().min(1).max(4096).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
  captcha_token: z.string().min(1).max(4096).optional()
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  captcha_token: z.string().min(1).max(4096).optional()
});

const passwordSchema = z.object({
  password: z.string().min(8).max(128)
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1).max(128),
  new_password: z.string().min(8).max(128)
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  avatar_url: z.string().url().optional().or(z.literal(""))
});

const requireSupabase = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new AppError(503, "Supabase Auth is not configured.");
  }
  return supabase;
};

const serializeProfile = (profile: {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: string;
  role?: string;
  subscriptionStatus?: string | null;
  subscriptionCurrentPeriodEnd?: Date | null;
}) => ({
  id: profile.id,
  email: profile.email,
  name: profile.name,
  avatar_url: profile.avatarUrl,
  plan: profile.plan.toLowerCase(),
  role: (profile.role ?? "USER").toLowerCase(),
  subscription_status: profile.subscriptionStatus ?? null,
  subscription_current_period_end: profile.subscriptionCurrentPeriodEnd ?? null
});

const profileSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  plan: true,
  role: true,
  subscriptionStatus: true,
  subscriptionCurrentPeriodEnd: true
} as const;

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: GENERIC_AUTH_ERROR } }
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Request accepted. Check your email if the account is eligible." } }
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "If the email is eligible, a reset link will be sent." } }
});

const signupMessage = "If the account is eligible, check your email to verify it.";
const resetMessage = "If the email is eligible, a reset link will be sent.";

router.post(
  "/signup",
  signupLimiter,
  asyncHandler(async (req, res) => {
    const body = signupSchema.parse(req.body);
    const email = normalizeEmail(body.email);
    const client = requireSupabase();

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existing) {
      await logSecurityEvent(req, {
        eventType: "signup_duplicate_attempt",
        severity: "warning",
        userId: existing.id,
        email
      });
      res.status(202).json({ message: signupMessage });
      return;
    }

    const { data, error } = await client.auth.signUp({
      email,
      password: body.password,
      options: {
        data: {
          name: body.name
        },
        emailRedirectTo: `${env.FRONTEND_URL}/auth/callback`,
        captchaToken: body.captcha_token
      }
    });

    if (error) {
      await logSecurityEvent(req, {
        eventType: "signup_failed",
        severity: "warning",
        email,
        metadata: { provider: "supabase" }
      });
      res.status(202).json({ message: signupMessage });
      return;
    }

    if (data.user?.email) {
      await prisma.user.upsert({
        where: { id: data.user.id },
        create: {
          id: data.user.id,
          email,
          name: body.name ?? null,
          avatarUrl: null,
          plan: "FREE",
          role: "USER"
        },
        update: {
          email,
          name: body.name ?? undefined
        },
        select: { id: true }
      });
    }

    await logSecurityEvent(req, {
      eventType: "signup_verification_sent",
      email
    });

    res.status(202).json({
      message: signupMessage
    });
  })
);

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const email = normalizeEmail(body.email);
    const client = requireSupabase();
    const existingProfile = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        failedLoginAttempts: true,
        lockedUntil: true
      }
    });

    await enforceCaptchaIfSuspicious(req, email, body.captcha_token);
    enforceAccountNotLocked(existingProfile?.lockedUntil);

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: body.password
    });

    if (error || !data.user?.email || !data.session) {
      await recordFailedLogin(req, {
        email,
        userId: existingProfile?.id,
        currentAttempts: existingProfile?.failedLoginAttempts,
        reason: "invalid_credentials"
      });
      throw new AppError(401, GENERIC_AUTH_ERROR);
    }

    if (!data.user.email_confirmed_at) {
      await recordFailedLogin(req, {
        email,
        userId: existingProfile?.id,
        currentAttempts: existingProfile?.failedLoginAttempts,
        reason: "email_unverified"
      });
      throw new AppError(401, GENERIC_AUTH_ERROR);
    }

    const metadata = data.user.user_metadata ?? {};
    const profile = await prisma.user.upsert({
      where: { id: data.user.id },
      create: {
        id: data.user.id,
        email,
        name: metadata.name ?? metadata.full_name ?? null,
        avatarUrl: metadata.avatar_url ?? metadata.picture ?? null,
        plan: "FREE",
        role: "USER"
      },
      update: {
        email,
        name: metadata.name ?? metadata.full_name ?? undefined,
        avatarUrl: metadata.avatar_url ?? metadata.picture ?? undefined
      },
      select: profileSelect
    });

    await recordSuccessfulLogin(req, { email, userId: profile.id });
    const csrfToken = setSessionCookies(res, data.session);

    res.json({
      user: serializeProfile(profile),
      session: data.session,
      csrf_token: csrfToken
    });
  })
);

router.post(
  "/password/forgot",
  passwordResetLimiter,
  asyncHandler(async (req, res) => {
    const body = forgotPasswordSchema.parse(req.body);
    const email = normalizeEmail(body.email);
    const client = requireSupabase();

    await client.auth
      .resetPasswordForEmail(email, {
        redirectTo: `${env.FRONTEND_URL}/auth/callback?next=/reset-password`,
        captchaToken: body.captcha_token
      })
      .then(async ({ error }) => {
        await logSecurityEvent(req, {
          eventType: error ? "password_reset_request_failed" : "password_reset_requested",
          severity: error ? "warning" : "info",
          email
        });
      })
      .catch(async () => {
        await logSecurityEvent(req, {
          eventType: "password_reset_request_failed",
          severity: "warning",
          email
        });
      });

    res.json({ message: resetMessage });
  })
);

router.post(
  "/verification/resend",
  passwordResetLimiter,
  asyncHandler(async (req, res) => {
    const body = forgotPasswordSchema.parse(req.body);
    const email = normalizeEmail(body.email);
    const client = requireSupabase();

    await client.auth
      .resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${env.FRONTEND_URL}/auth/callback`,
          captchaToken: body.captcha_token
        }
      })
      .then(async ({ error }) => {
        await logSecurityEvent(req, {
          eventType: error ? "verification_resend_failed" : "verification_resent",
          severity: error ? "warning" : "info",
          email
        });
      })
      .catch(async () => {
        await logSecurityEvent(req, {
          eventType: "verification_resend_failed",
          severity: "warning",
          email
        });
      });

    res.json({ message: signupMessage });
  })
);

router.post(
  "/password/reset",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = passwordSchema.parse(req.body);
    if (!supabaseAdmin) throw new AppError(503, "Password reset is unavailable.");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.auth!.user.id, {
      password: body.password
    });

    if (error) throw new AppError(400, "Password could not be updated.");

    await prisma.user.update({
      where: { id: req.auth!.user.id },
      data: {
        lastPasswordResetAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null
      },
      select: { id: true }
    });

    await supabaseAdmin.auth.admin.signOut(req.auth!.token, "global").catch(() => undefined);
    clearSessionCookies(res);
    await logSecurityEvent(req, {
      eventType: "password_reset_completed",
      severity: "warning",
      userId: req.auth!.user.id,
      email: req.auth!.user.email
    });

    res.json({ message: "Password updated. Sign in again." });
  })
);

router.post(
  "/password/change",
  requireAuth,
  requireMfaForSensitiveAction,
  asyncHandler(async (req, res) => {
    const body = changePasswordSchema.parse(req.body);
    const client = requireSupabase();
    if (!supabaseAdmin) throw new AppError(503, "Password change is unavailable.");

    const { error: verifyError } = await client.auth.signInWithPassword({
      email: req.auth!.user.email,
      password: body.current_password
    });

    if (verifyError) {
      await logSecurityEvent(req, {
        eventType: "password_change_failed",
        severity: "warning",
        userId: req.auth!.user.id,
        email: req.auth!.user.email,
        metadata: { reason: "invalid_current_password" }
      });
      throw new AppError(401, GENERIC_AUTH_ERROR);
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.auth!.user.id, {
      password: body.new_password
    });

    if (error) throw new AppError(400, "Password could not be updated.");

    await prisma.user.update({
      where: { id: req.auth!.user.id },
      data: {
        lastPasswordResetAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null
      },
      select: { id: true }
    });

    await supabaseAdmin.auth.admin.signOut(req.auth!.token, "global").catch(() => undefined);
    clearSessionCookies(res);
    await logSecurityEvent(req, {
      eventType: "password_changed",
      severity: "warning",
      userId: req.auth!.user.id,
      email: req.auth!.user.email
    });

    res.json({ message: "Password updated. Sign in again." });
  })
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const authToken = readAuthToken(req);
    const token = authToken?.token;

    if (token && supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.auth.admin.signOut(token);
        if (error) console.warn("Supabase admin sign-out failed.", error.message);
      } catch (error) {
        console.warn("Supabase admin sign-out failed.", error);
      }
    } else if (token) {
      console.warn("SUPABASE_SERVICE_ROLE_KEY is not set; skipping server-side sign-out.");
    }

    clearSessionCookies(res);
    res.json({ ok: true });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const threadCount = await prisma.thread.count({
      where: { userId: req.auth!.user.id }
    });

    res.json({
      user: serializeProfile(req.auth!.user),
      stats: {
        total_threads: threadCount
      }
    });
  })
);

router.patch(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = updateProfileSchema.parse(req.body);
    const updated = await prisma.user.update({
      where: { id: req.auth!.user.id },
      data: {
        name: body.name,
        avatarUrl: body.avatar_url === "" ? null : body.avatar_url
      },
      select: profileSelect
    });

    res.json({ user: serializeProfile(updated) });
  })
);

router.delete(
  "/me",
  requireAuth,
  requireMfaForSensitiveAction,
  asyncHandler(async (req, res) => {
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(req.auth!.user.id);
      if (error) throw new AppError(502, "Could not delete the account.");
    } else {
      console.warn("SUPABASE_SERVICE_ROLE_KEY is not set; deleting Prisma user only.");
    }

    await logSecurityEvent(req, {
      eventType: "account_deleted",
      severity: "critical",
      userId: req.auth!.user.id,
      email: req.auth!.user.email
    });

    await prisma.user.delete({
      where: { id: req.auth!.user.id },
      select: { id: true }
    });

    clearSessionCookies(res);
    res.status(204).send();
  })
);

export default router;
