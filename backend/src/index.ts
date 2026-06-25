import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env, isProduction } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import billingRoutes, { razorpayWebhook } from "./routes/billing.js";
import threadRoutes from "./routes/threads.js";
import { errorHandler } from "./middleware/error.js";
import { prisma } from "./lib/prisma.js";

const app = express();
app.set("trust proxy", 1);

if (isProduction && !env.FRONTEND_URL) {
  throw new Error("FRONTEND_URL must be set in production. Refusing to start.");
}

const globalLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many requests. Wait a few minutes, then try again." } }
});

const readSupabaseProjectRef = (value: string | undefined) => {
  if (!value) return null;

  try {
    const url = value.startsWith("postgresql://") ? new URL(value) : new URL(value);
    const projectFromHost = url.hostname.match(/(?:^|\.)db\.([a-z0-9]{20})\.supabase\.co$/)?.[1];
    const projectFromUser = decodeURIComponent(url.username).match(/^postgres\.([a-z0-9]{20})$/)?.[1];
    return projectFromHost ?? projectFromUser ?? null;
  } catch {
    return null;
  }
};

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), razorpayWebhook);
app.use(globalLimiter);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

const healthPayload = () =>
  isProduction
    ? {
        ok: true,
        service: "aiflow-api"
      }
    : {
    ok: true,
    service: "aiflow-api",
    diagnostics: "razorpay-billing",
    config: {
      supabaseUrl: Boolean(env.SUPABASE_URL),
      supabaseAnonKey: Boolean(env.SUPABASE_ANON_KEY),
      databaseUrl: Boolean(env.DATABASE_URL),
      databaseUrlSource: env.DATABASE_URL_SOURCE,
      databaseProjectRef: readSupabaseProjectRef(env.DATABASE_URL),
      directUrlSource: env.DIRECT_URL_SOURCE,
      supabaseProjectRef: readSupabaseProjectRef(env.SUPABASE_URL),
      geminiApiKey: Boolean(env.GEMINI_API_KEY),
      razorpayKeyId: Boolean(env.RAZORPAY_KEY_ID),
      razorpayKeySecret: Boolean(env.RAZORPAY_KEY_SECRET),
      razorpayWebhookSecret: Boolean(env.RAZORPAY_WEBHOOK_SECRET),
      razorpayStarterPlanId: Boolean(env.RAZORPAY_STARTER_PLAN_ID),
      razorpayProPlanId: Boolean(env.RAZORPAY_PRO_PLAN_ID),
      razorpayTeamPlanId: Boolean(env.RAZORPAY_TEAM_PLAN_ID),
      frontendUrl: env.FRONTEND_URL
    }
};

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json(healthPayload());
  } catch (error) {
    console.error("Health check DB connection failed:", error);
    res.status(503).json({
      ok: false,
      service: "aiflow-api",
      error: "Database connection failed",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json(healthPayload());
  } catch (error) {
    console.error("Health check DB connection failed:", error);
    res.status(503).json({
      ok: false,
      service: "aiflow-api",
      error: "Database connection failed",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/threads", threadRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: { message: "Route not found." } });
});
app.use(errorHandler);

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`AIFlow API running on http://0.0.0.0:${env.PORT}`);
});
