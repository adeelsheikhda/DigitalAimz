// Injects the stored Supabase config into the page's window before the portal
// scripts (config.js / app.js) run, so the bundled web app talks to the cloud.
const { ipcRenderer } = require("electron");

const cfg = ipcRenderer.sendSync("get-config-sync");
if (cfg && cfg.SUPABASE_URL) {
  window.__CONFIG = {
    SUPABASE_URL: cfg.SUPABASE_URL,
    SUPABASE_ANON_KEY: cfg.SUPABASE_ANON_KEY,
  };
  window.__CONFIG_READY = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
}

// Expose the save API for the first-run settings screen.
window.desktopAPI = {
  saveConfig: (url, anonKey) =>
    ipcRenderer.invoke("save-config", { url, anonKey }),
};
