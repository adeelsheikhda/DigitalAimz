// Initialises a single shared Supabase client from window.__CONFIG.
// Loaded as an ES module; exposes `supabase` for the other modules.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cfg = window.__CONFIG || {};

export const supabase = createClient(
  cfg.SUPABASE_URL,
  cfg.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const CONFIG_READY = !!window.__CONFIG_READY;
