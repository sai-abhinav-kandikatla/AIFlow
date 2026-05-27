import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { env, isSupabaseConfigured } from "../config/env.js";

export const supabase = isSupabaseConfigured
  ? createClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
      realtime: {
        transport: WebSocket as never
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;
