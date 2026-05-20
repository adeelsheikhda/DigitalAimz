// Two-way task sync with a Trello list.
// Secrets: TRELLO_KEY, TRELLO_TOKEN, TRELLO_LIST_ID
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  getCaller,
  readBody,
  fetchTasks,
  getSyncMap,
  upsertSync,
  setTaskDone,
} from "../_shared/client.ts";

const KEY = Deno.env.get("TRELLO_KEY");
const TOKEN = Deno.env.get("TRELLO_TOKEN");
const LIST_ID = Deno.env.get("TRELLO_LIST_ID");
const auth = () => `key=${KEY}&token=${TOKEN}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const user = await getCaller(req);
  if (!user) return json({ error: "unauthorized" }, 401);

  const connected = !!(KEY && TOKEN && LIST_ID);
  const { direction = "both" } = await readBody(req);
  if (direction === "status") return json({ connected });
  if (!connected) return json({ error: "Trello not configured" }, 400);

  let count = 0;
  const tasks = await fetchTasks();
  const map = await getSyncMap("trello");

  // PUSH: create/update a card per task.
  if (direction === "both" || direction === "push") {
    for (const t of tasks) {
      const name = t.title;
      const existing = map.get(t.id);
      if (existing) {
        await fetch(
          `https://api.trello.com/1/cards/${existing}?${auth()}&name=${encodeURIComponent(
            name
          )}&dueComplete=${t.done}`,
          { method: "PUT" }
        );
      } else {
        const res = await fetch(
          `https://api.trello.com/1/cards?${auth()}&idList=${LIST_ID}&name=${encodeURIComponent(
            name
          )}&dueComplete=${t.done}`,
          { method: "POST" }
        );
        if (res.ok) {
          const card = await res.json();
          await upsertSync("trello", t.id, card.id);
        }
      }
      count++;
    }
  }

  // PULL: reflect card completion back into tasks.
  if (direction === "both" || direction === "pull") {
    const res = await fetch(
      `https://api.trello.com/1/lists/${LIST_ID}/cards?${auth()}&fields=id,dueComplete`
    );
    if (res.ok) {
      const cards: { id: string; dueComplete: boolean }[] = await res.json();
      const byExternal = new Map<string, string>();
      for (const [taskId, ext] of map) byExternal.set(ext, taskId);
      for (const c of cards) {
        const taskId = byExternal.get(c.id);
        if (taskId) await setTaskDone(taskId, !!c.dueComplete);
      }
    }
  }

  return json({ ok: true, count });
});
