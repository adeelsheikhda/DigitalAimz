// Mirror tasks into a Google Tasks list (two-way completion sync).
// Secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
//          GOOGLE_TASKLIST_ID
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  getCaller,
  readBody,
  fetchTasks,
  getSyncMap,
  upsertSync,
  setTaskDone,
} from "../_shared/client.ts";

const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
const REFRESH_TOKEN = Deno.env.get("GOOGLE_REFRESH_TOKEN");
const TASKLIST = Deno.env.get("GOOGLE_TASKLIST_ID");

async function accessToken(): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      refresh_token: REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const user = await getCaller(req);
  if (!user) return json({ error: "unauthorized" }, 401);

  const connected = !!(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN && TASKLIST);
  const { direction = "both" } = await readBody(req);
  if (direction === "status") return json({ connected });
  if (!connected) return json({ error: "Google Tasks not configured" }, 400);

  const token = await accessToken();
  if (!token) return json({ error: "Google auth failed" }, 400);
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const base = `https://tasks.googleapis.com/tasks/v1/lists/${TASKLIST}/tasks`;

  let count = 0;
  const tasks = await fetchTasks();
  const map = await getSyncMap("google");

  if (direction === "both" || direction === "push") {
    for (const t of tasks) {
      const body = JSON.stringify({
        title: t.title,
        status: t.done ? "completed" : "needsAction",
      });
      const existing = map.get(t.id);
      if (existing) {
        await fetch(`${base}/${existing}`, { method: "PATCH", headers, body });
      } else {
        const res = await fetch(base, { method: "POST", headers, body });
        if (res.ok) {
          const created = await res.json();
          await upsertSync("google", t.id, created.id);
        }
      }
      count++;
    }
  }

  if (direction === "both" || direction === "pull") {
    const res = await fetch(`${base}?showCompleted=true&showHidden=true`, { headers });
    if (res.ok) {
      const data = await res.json();
      const byExternal = new Map<string, string>();
      for (const [taskId, ext] of map) byExternal.set(ext, taskId);
      for (const g of data.items ?? []) {
        const taskId = byExternal.get(g.id);
        if (taskId) await setTaskDone(taskId, g.status === "completed");
      }
    }
  }

  return json({ ok: true, count });
});
