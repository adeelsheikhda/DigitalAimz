// Session helpers + page guards.
import { supabase, CONFIG_READY } from "./supabaseClient.js";

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Redirect to login.html if not authenticated. Returns the session.
export async function requireAuth() {
  if (!CONFIG_READY) {
    document.body.innerHTML =
      '<div class="config-banner">Supabase is not configured. Edit web/js/config.js (see docs/SETUP.md).</div>';
    throw new Error("config-not-ready");
  }
  const session = await getSession();
  if (!session) {
    window.location.replace("login.html");
    throw new Error("no-session");
  }
  return session;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.replace("login.html");
}

export async function currentProfile(session) {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", session.user.id)
    .maybeSingle();
  return data || { full_name: session.user.email, role: "member" };
}
