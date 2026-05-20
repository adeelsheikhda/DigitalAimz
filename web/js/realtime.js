// Subscribe to DB changes so every device updates live.
import { supabase } from "./supabaseClient.js";
import { loadAll } from "./data.js";

let timer = null;

// Coalesce bursts of changes into one reload + re-render.
function schedule(onChange) {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    await loadAll();
    onChange();
  }, 200);
}

export function subscribeRealtime(onChange) {
  const channel = supabase.channel("seo-lead-os");
  ["tasks", "projects", "money_pages", "team_members"].forEach((table) => {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => schedule(onChange)
    );
  });
  channel.subscribe();
  return channel;
}
