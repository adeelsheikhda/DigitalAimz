// Push tasks into a ClickUp list (and pull completion status back).
// Secrets: CLICKUP_TOKEN, CLICKUP_LIST_ID
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  getCaller,
  readBody,
  fetchTasks,
  getSyncMap,
  upsertSync,
  setTaskDone,
} from "../_shared/client.ts";

const TOKEN = Deno.env.get("CLICKUP_TOKEN");
const LIST_ID = Deno.env.get("CLICKUP_LIST_ID");
const headers = () => ({
  Authorization: TOKEN ?? "",
  "Content-Type": "application/json",
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const user = await getCaller(req);
  if (!user) return json({ error: "unauthorized" }, 401);

  const connected = !!(TOKEN && LIST_ID);
  const { direction = "both" } = await readBody(req);
  if (direction === "status") return json({ connected });
  if (!connected) return json({ error: "ClickUp not configured" }, 400);

  let count = 0;
  const tasks = await fetchTasks();
  const map = await getSyncMap("clickup");

  if (direction === "both" || direction === "push") {
    for (const t of tasks) {
      const body = JSON.stringify({
        name: t.title,
        status: t.done ? "complete" : "to do",
      });
      const existing = map.get(t.id);
      if (existing) {
        await fetch(`https://api.clickup.com/api/v2/task/${existing}`, {
          method: "PUT",
          headers: headers(),
          body,
        });
      } else {
        const res = await fetch(
          `https://api.clickup.com/api/v2/list/${LIST_ID}/task`,
          { method: "POST", headers: headers(), body }
        );
        if (res.ok) {
          const created = await res.json();
          await upsertSync("clickup", t.id, created.id);
        }
      }
      count++;
    }
  }

  if (direction === "both" || direction === "pull") {
    const res = await fetch(
      `https://api.clickup.com/api/v2/list/${LIST_ID}/task?include_closed=true`,
      { headers: headers() }
    );
    if (res.ok) {
      const data = await res.json();
      const byExternal = new Map<string, string>();
      for (const [taskId, ext] of map) byExternal.set(ext, taskId);
      for (const c of data.tasks ?? []) {
        const taskId = byExternal.get(c.id);
        if (taskId) {
          const done = (c.status?.type ?? "") === "closed" ||
            (c.status?.status ?? "").toLowerCase() === "complete";
          await setTaskDone(taskId, done);
        }
      }
    }
  }

  return json({ ok: true, count });
});
