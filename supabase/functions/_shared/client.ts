// Shared helpers for the sync Edge Functions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

// Service-role client: bypasses RLS, used to read/write tasks + sync map.
export const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

// Verify the caller is a logged-in user. Returns the user or null.
export async function getCaller(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return null;
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

export async function readBody(req: Request): Promise<{ direction?: string }> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

// Tasks joined with assignee + project names, for pushing to external tools.
export async function fetchTasks() {
  const { data } = await admin
    .from("tasks")
    .select(
      "id, title, done, due, priority, project:projects(name), assignee:team_members(name)"
    );
  return data ?? [];
}

export async function getSyncMap(provider: string) {
  const { data } = await admin
    .from("task_sync_map")
    .select("task_id, external_id")
    .eq("provider", provider);
  const map = new Map<string, string>();
  (data ?? []).forEach((r: { task_id: string; external_id: string }) =>
    map.set(r.task_id, r.external_id)
  );
  return map;
}

export async function upsertSync(
  provider: string,
  taskId: string,
  externalId: string
) {
  await admin.from("task_sync_map").upsert({
    task_id: taskId,
    provider,
    external_id: externalId,
    updated_at: new Date().toISOString(),
  });
}

export async function setTaskDone(taskId: string, done: boolean) {
  await admin.from("tasks").update({ done }).eq("id", taskId);
}
