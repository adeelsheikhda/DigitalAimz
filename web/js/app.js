// App entry: auth guard, data load, realtime, navigation, event wiring.
import { requireAuth, signOut, currentProfile } from "./auth.js";
import {
  loadAll,
  store,
  createTask,
  deleteTask,
  toggleTaskDone,
  reassignTask,
} from "./data.js";
import { subscribeRealtime } from "./realtime.js";
import { renderAll, renderTasks, esc } from "./render.js";
import { syncProvider, getConnections } from "./integrations.js";

const $ = (id) => document.getElementById(id);

const DAILY_CHECKS = [
  "Check GSC for overnight ranking changes",
  "Review team task completions from yesterday",
  "Identify any money page position drops",
  "Send morning focus note to team (Slack/WhatsApp)",
  "Unblock any team members waiting on you",
  "Check crawl errors — new entries?",
  "Review 1 competitor for new content/links",
  "Log today's Q1 priority task (do it yourself or assign)",
];
let checkState = new Array(DAILY_CHECKS.length).fill(false);

const VIEWS = [
  "dashboard",
  "projects",
  "moneypages",
  "tasks",
  "assign",
  "team",
  "matrix",
  "brief",
  "integrations",
];

function showView(id) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
  $("view-" + id)?.classList.add("active");
  document.querySelectorAll(".nav-item")[VIEWS.indexOf(id)]?.classList.add("active");
  if (id === "tasks") renderTasks();
}
window.showView = showView;

// ── ASSIGN FORM ────────────────────────────────────────────────────────────
function populateAssignSelects() {
  const a = $("f-assign");
  const p = $("f-project");
  if (a)
    a.innerHTML = store.team
      .map((m) => `<option value="${m.id}">${esc(m.name)} (${esc(m.role || "")})</option>`)
      .join("");
  if (p)
    p.innerHTML = store.projects
      .map((pr) => `<option value="${pr.id}">${esc(pr.name)}</option>`)
      .join("");
}

async function addTask() {
  const title = $("f-title").value.trim();
  if (!title) {
    alert("Add a task description first.");
    return;
  }
  try {
    await createTask({
      title,
      assignee_id: $("f-assign").value || null,
      project_id: $("f-project").value || null,
      priority: $("f-priority").value,
      type: $("f-type").value,
      due: $("f-due").value || "TBD",
      notes: $("f-notes").value || null,
      done: false,
    });
    resetForm();
    showToast("Task assigned");
    setTimeout(() => showView("tasks"), 500);
  } catch (e) {
    alert("Could not save task: " + (e.message || e));
  }
}
window.addTask = addTask;

function resetForm() {
  ["f-title", "f-due", "f-notes"].forEach((id) => {
    if ($(id)) $(id).value = "";
  });
}
window.resetForm = resetForm;

// ── DAILY CHECKS ─────────────────────────────────────────────────────────────
function renderDailyChecks() {
  const el = $("dailyCheckList");
  if (!el) return;
  el.innerHTML = DAILY_CHECKS.map(
    (c, i) => `
    <div class="task-row" data-action="check" data-i="${i}" style="cursor:pointer">
      <div class="task-check ${checkState[i] ? "done" : ""}">${
      checkState[i] ? "✓" : ""
    }</div>
      <div class="task-body"><div class="task-title ${
        checkState[i] ? "done-text" : ""
      }">${esc(c)}</div></div>
    </div>`
  ).join("");
}

// ── INTEGRATIONS UI ──────────────────────────────────────────────────────────
const INTEGRATIONS = [
  { id: "trello", name: "Trello", color: "#0079bf", letter: "T", desc: "Two-way sync of tasks with a Trello board." },
  { id: "clickup", name: "ClickUp", color: "#7b68ee", letter: "C", desc: "Push tasks into a ClickUp list." },
  { id: "google", name: "Google Tasks", color: "#1a73e8", letter: "G", desc: "Mirror tasks to a Google Tasks list." },
];

async function renderIntegrations() {
  const el = $("integrationsList");
  if (!el) return;
  el.innerHTML = INTEGRATIONS.map(
    (it) => `
    <div class="integration-card">
      <div class="integration-logo" style="background:${it.color}">${it.letter}</div>
      <div class="integration-info">
        <div class="integration-name">${it.name}</div>
        <div class="integration-desc">${it.desc}</div>
      </div>
      <span class="integration-status st-off" id="ist-${it.id}">checking…</span>
      <button class="btn btn-ghost btn-sm" data-action="sync" data-provider="${it.id}">Sync now</button>
    </div>`
  ).join("");

  const conns = await getConnections();
  INTEGRATIONS.forEach((it) => {
    const badge = $("ist-" + it.id);
    if (!badge) return;
    const on = conns[it.id];
    badge.textContent = on ? "Connected" : "Not configured";
    badge.className = "integration-status " + (on ? "st-on" : "st-off");
  });
}

async function handleSync(provider) {
  showToast("Syncing " + provider + "…");
  try {
    const res = await syncProvider(provider);
    showToast(provider + " synced" + (res?.count ? ` (${res.count})` : ""));
  } catch (e) {
    showToast("Sync failed: " + (e.message || e));
  }
}

// ── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = $("toast");
  t.textContent = "✓ " + msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}
window.showToast = showToast;

// ── EVENT DELEGATION (CSP-friendly, no inline handlers in dynamic HTML) ──────
function wireDelegation() {
  document.body.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    if (action === "toggle") {
      const id = el.dataset.id;
      const task = store.tasks.find((t) => t.id === id);
      if (task) await toggleTaskDone(id, !task.done);
    } else if (action === "delete") {
      if (confirm("Delete this task?")) await deleteTask(el.dataset.id);
    } else if (action === "check") {
      const i = +el.dataset.i;
      checkState[i] = !checkState[i];
      renderDailyChecks();
    } else if (action === "goprojects") {
      showView("projects");
    } else if (action === "sync") {
      handleSync(el.dataset.provider);
    } else if (action === "logout") {
      signOut();
    }
  });

  document.body.addEventListener("change", async (e) => {
    const el = e.target.closest('[data-action="reassign"]');
    if (el) await reassignTask(el.dataset.id, el.value || null);
  });
}

// ── INIT ──────────────────────────────────────────────────────────────────────
async function init() {
  const session = await requireAuth();

  $("todayLabel").textContent = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const profile = await currentProfile(session);
  if ($("userName")) $("userName").textContent = profile.full_name || "User";
  if ($("userEmail")) $("userEmail").textContent = session.user.email;

  await loadAll();
  populateAssignSelects();
  renderAll();
  renderDailyChecks();
  renderIntegrations();
  wireDelegation();

  subscribeRealtime(() => {
    populateAssignSelects();
    renderAll();
  });
}

init();
