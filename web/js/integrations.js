// "Sync now" calls to the Supabase Edge Functions.
import { supabase } from "./supabaseClient.js";

const PROVIDERS = {
  trello: "sync-trello",
  clickup: "sync-clickup",
  google: "sync-google-tasks",
};

export async function syncProvider(provider) {
  const fn = PROVIDERS[provider];
  if (!fn) throw new Error("unknown provider " + provider);
  const { data, error } = await supabase.functions.invoke(fn, {
    body: { direction: "both" },
  });
  if (error) throw error;
  return data;
}

export async function getConnections() {
  // integration_connections is service-role only, so the browser asks the
  // function for status rather than querying the table directly.
  const results = {};
  for (const p of Object.keys(PROVIDERS)) {
    try {
      const { data } = await supabase.functions.invoke(PROVIDERS[p], {
        body: { direction: "status" },
      });
      results[p] = !!(data && data.connected);
    } catch {
      results[p] = false;
    }
  }
  return results;
}
