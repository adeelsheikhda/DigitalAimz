// Runtime configuration for the SEO Lead OS portal.
//
// This file is intentionally NOT secret: the Supabase anon key is safe to ship
// to browsers because Row Level Security protects the data.
//
//  • Web deploy  → generate this file from env at build/deploy time
//                  (see docs/SETUP.md). Copy config.sample.js → config.js.
//  • Desktop app → Electron's preload.js sets window.__CONFIG before this
//                  loads, so the values below are used only as a fallback.
window.__CONFIG = window.__CONFIG || {
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-ANON-KEY",
};

window.__CONFIG_READY =
  window.__CONFIG.SUPABASE_URL &&
  !window.__CONFIG.SUPABASE_URL.includes("YOUR-PROJECT") &&
  window.__CONFIG.SUPABASE_ANON_KEY &&
  !window.__CONFIG.SUPABASE_ANON_KEY.includes("YOUR-ANON-KEY");
