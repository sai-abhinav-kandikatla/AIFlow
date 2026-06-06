import "dotenv/config";

const parsePort = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 4000;
};

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const databaseUrl = process.env.AIFLOW_DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;
const directUrl = process.env.AIFLOW_DIRECT_URL ?? process.env.SUPABASE_DIRECT_URL ?? process.env.DIRECT_URL;
const frontendUrl =
  process.env.FRONTEND_URL ?? (process.env.NODE_ENV === "production" ? undefined : "http://localhost:5173");

const databaseUrlSource = process.env.AIFLOW_DATABASE_URL
  ? "AIFLOW_DATABASE_URL"
  : process.env.SUPABASE_DATABASE_URL
    ? "SUPABASE_DATABASE_URL"
    : process.env.DATABASE_URL
      ? "DATABASE_URL"
      : null;

const directUrlSource = process.env.AIFLOW_DIRECT_URL
  ? "AIFLOW_DIRECT_URL"
  : process.env.SUPABASE_DIRECT_URL
    ? "SUPABASE_DIRECT_URL"
    : process.env.DIRECT_URL
      ? "DIRECT_URL"
      : null;

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parsePort(process.env.PORT),
  FRONTEND_URL: frontendUrl,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  SECURITY_LOG_SALT: process.env.SECURITY_LOG_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "aiflow-local-security-salt",
  CAPTCHA_SECRET: process.env.CAPTCHA_SECRET,
  CAPTCHA_VERIFY_URL: process.env.CAPTCHA_VERIFY_URL ?? "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  SUPABASE_URL: supabaseUrl,
  SUPABASE_ANON_KEY: supabaseAnonKey,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  // Auth is handled by Supabase JWT — no custom JWT signing needed
  DATABASE_URL: databaseUrl,
  DIRECT_URL: directUrl,
  DATABASE_URL_SOURCE: databaseUrlSource,
  DIRECT_URL_SOURCE: directUrlSource,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  RAZORPAY_STARTER_PLAN_ID: process.env.RAZORPAY_STARTER_PLAN_ID,
  RAZORPAY_PRO_PLAN_ID: process.env.RAZORPAY_PRO_PLAN_ID,
  RAZORPAY_TEAM_PLAN_ID: process.env.RAZORPAY_TEAM_PLAN_ID
};

export const isProduction = env.NODE_ENV === "production";
export const isSupabaseConfigured = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
export const isSupabaseAdminConfigured = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
export const isGeminiConfigured = Boolean(env.GEMINI_API_KEY);
export const isRazorpayConfigured = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
