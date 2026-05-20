// Rendering layer — ported from the prototype, now fed from the DB store.
import { store, teamById, projectById } from "./data.js";

const $ = (id) => document.getElementById(id);

// Escape user-supplied text before injecting into innerHTML.
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

// ── TEAM ────────────────────────────────────────────────────────────────
function loadColor(t, cap) {
  if (t / cap >= 1) return "load-red";
  if (t / cap >= 0.8) return "load-warn";
  return "load-green";
}
function statusLabel(t, cap) {
  if (t / cap >= 1)
    return '<span style="color:var(--critical);font-weight:700;">Overloaded</span>';
  if (t / cap >= 0.8)
    return '<span style="color:var(--warn);font-weight:700;">Near Limit</span>';
  return '<span style="color:var(--accent3);font-weight:700;">Available</span>';
}
const openCountFor = (memberId) =>
  store.tasks.filter((t) => t.assignee_id === memberId && !t.done).length;

export function renderTeamMini() {
  const el = $("teamLoadMini");
  if (!el) return;
  el.innerHTML = store.team
    .map((m) => {
      const taskCount = openCountFor(m.id);
      const pct = Math.round((taskCount / m.capacity) * 100);
      return `<tr>
      <td><div class="member-cell">
        <div class="avatar" style="background:${esc(m.color)}">${esc(
        m.name[0]
      )}</div>
        <span style="font-weight:600">${esc(m.name)}</span>
      </div></td>
      <td><div class="load-bar"><div class="load-fill ${loadColor(
        taskCount,
        m.capacity
      )}" style="width:${Math.min(pct, 100)}%"></div></div></td>
      <td><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted)">${taskCount}/${
        m.capacity
      }</span></td>
    </tr>`;
    })
    .join("");
}

export function renderTeamFull() {
  const el = $("teamTableFull");
  if (!el) return;
  el.innerHTML = store.team
    .map((m) => {
      const taskCount = openCountFor(m.id);
      const pct = Math.round((taskCount / m.capacity) * 100);
      const focus = m.focus_project_id
        ? projectById(m.focus_project_id)?.name || "—"
        : "—";
      return `<tr>
      <td><div class="member-cell">
        <div class="avatar" style="background:${esc(m.color)}">${esc(
        m.name[0]
      )}</div>
        <div><div style="font-weight:700">${esc(m.name)}</div></div>
      </div></td>
      <td style="color:var(--muted);font-size:12px">${esc(m.role || "")}</td>
      <td><span style="font-family:'JetBrains Mono',monospace;font-size:12px">${taskCount} open</span></td>
      <td><div style="display:flex;align-items:center;gap:8px">
        <div class="load-bar"><div class="load-fill ${loadColor(
          taskCount,
          m.capacity
        )}" style="width:${Math.min(pct, 100)}%"></div></div>
        <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted)">${pct}%</span>
      </div></td>
      <td>${statusLabel(taskCount, m.capacity)}</td>
      <td style="font-size:12px;color:var(--muted)">${esc(focus)}</td>
    </tr>`;
    })
    .join("");
}

// ── PROJECTS ──────────────────────────────────────────────────────────────
const PRIO_CLASS = {
  critical: "p-critical",
  high: "p-high",
  mid: "p-mid",
  low: "p-low",
};
const openCountForProject = (pid) =>
  store.tasks.filter((t) => t.project_id === pid && !t.done).length;

export function renderProjects() {
  const el = $("projectsList");
  if (!el) return;
  const ranked = [...store.projects].sort(
    (a, b) =>
      ["critical", "high", "mid", "low"].indexOf(a.priority) -
      ["critical", "high", "mid", "low"].indexOf(b.priority)
  );
  el.innerHTML = ranked
    .map(
      (p) => `
    <div class="card" style="border-left:4px solid ${esc(p.color)}">
      <div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:200px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
            <span style="font-size:15px;font-weight:800">${esc(p.name)}</span>
            <span class="priority-tag ${PRIO_CLASS[p.priority]}">${esc(
        p.priority
      )}</span>
          </div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);margin-bottom:10px">${esc(
            p.url
          )} · ${openCountForProject(p.id)} tasks open</div>
          <div style="font-size:13px;color:var(--muted);line-height:1.6">${esc(
            p.note || ""
          )}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0">
          <div style="font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:700;color:${esc(
            p.color
          )}">${p.health}%</div>
          <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">Health Score</div>
          <div style="width:120px;height:6px;background:var(--border);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${
              p.health
            }%;background:${esc(p.color)};border-radius:3px"></div>
          </div>
        </div>
      </div>
    </div>`
    )
    .join("");
}

// ── MONEY PAGES ─────────────────────────────────────────────────────────────
export function renderMoneyPages() {
  const el = $("moneyPagesList");
  if (!el) return;
  const pages = [...store.moneyPages].sort((a, b) => b.impressions - a.impressions);
  el.innerHTML = pages
    .map((p, i) => {
      const chgClass =
        p.pos_change < 0 ? "pos-down" : p.pos_change > 0 ? "pos-up" : "pos-same";
      const chgStr =
        p.pos_change < 0
          ? `▼${Math.abs(p.pos_change)}`
          : p.pos_change > 0
          ? `▲${p.pos_change}`
          : "—";
      const statusColor =
        p.status === "drop"
          ? "var(--critical)"
          : p.status === "rising"
          ? "var(--accent3)"
          : "var(--muted)";
      return `<div class="money-page-row">
      <div class="mp-rank">${i + 1}</div>
      <div class="mp-info">
        <div class="mp-url">${esc(p.url)}</div>
        <div class="mp-kw">${esc(p.keyword || "")}</div>
        <div style="font-size:11px;margin-top:4px;color:${statusColor}">${esc(
        p.action || ""
      )}</div>
      </div>
      <div class="mp-metrics">
        <div class="mp-stat"><div class="mp-val">pos ${p.position}</div><div class="mp-lbl">Position</div></div>
        <div class="mp-stat"><div class="mp-val ${chgClass}">${chgStr}</div><div class="mp-lbl">Change</div></div>
        <div class="mp-stat"><div class="mp-val">${(p.impressions || 0).toLocaleString()}</div><div class="mp-lbl">Impr.</div></div>
        <div class="mp-stat"><div class="mp-val">${esc(p.ctr || "")}</div><div class="mp-lbl">CTR</div></div>
      </div>
    </div>`;
    })
    .join("");
}

// ── TASKS ───────────────────────────────────────────────────────────────────
function taskHTML(t) {
  const assignee = teamById(t.assignee_id);
  const project = projectById(t.project_id);
  const options = store.team
    .map(
      (m) =>
        `<option value="${m.id}" ${
          m.id === t.assignee_id ? "selected" : ""
        }>${esc(m.name)}</option>`
    )
    .join("");
  return `<div class="task-row">
    <div class="task-check ${t.done ? "done" : ""}" data-action="toggle" data-id="${
    t.id
  }">${t.done ? "✓" : ""}</div>
    <div class="task-body">
      <div class="task-title ${t.done ? "done-text" : ""}">${esc(t.title)}</div>
      <div class="task-meta">
        <span class="task-tag ${t.type}">${esc(
    t.type.replace("t-", "").toUpperCase()
  )}</span>
        <span class="task-assign">→ ${esc(assignee ? assignee.name : "Unassigned")}</span>
        <span style="font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace">${esc(
          project ? project.name : ""
        )}</span>
        <span class="task-due">${esc(t.due || "")}</span>
      </div>
      <div class="task-actions">
        <select class="task-reassign" data-action="reassign" data-id="${
          t.id
        }" title="Delegate to">${options}</select>
        <button class="task-del" data-action="delete" data-id="${
          t.id
        }">Delete</button>
      </div>
    </div>
  </div>`;
}

export function renderTasks() {
  const buckets = { critical: [], high: [], progress: [], done: [] };
  store.tasks.forEach((t) => {
    if (t.done) buckets.done.push(t);
    else (buckets[t.priority] || buckets.high).push(t);
  });
  ["critical", "high", "progress", "done"].forEach((b) => {
    const list = $(
      `taskList${b.charAt(0).toUpperCase() + b.slice(1)}`
    );
    if (list)
      list.innerHTML =
        buckets[b].map((t) => taskHTML(t)).join("") ||
        `<div style="padding:16px 0;text-align:center;color:var(--muted);font-size:13px">No tasks here</div>`;
    const count = $(`${b}Count`);
    if (count) count.textContent = buckets[b].length;
  });

  // Header / dashboard metrics derived from live data.
  const open = store.tasks.filter((t) => !t.done).length;
  const done = store.tasks.filter((t) => t.done).length;
  if ($("taskCountMetric")) $("taskCountMetric").textContent = open + done;
  if ($("doneCountMetric")) $("doneCountMetric").textContent = done;
  if ($("projCountMetric")) $("projCountMetric").textContent = store.projects.length;
  if ($("projCritMetric"))
    $("projCritMetric").textContent =
      store.projects.filter((p) => p.priority === "critical").length +
      " critical priority";
  if ($("mpCountMetric")) $("mpCountMetric").textContent = store.moneyPages.length;
  if ($("mpDropMetric"))
    $("mpDropMetric").textContent =
      store.moneyPages.filter((p) => p.status === "drop").length +
      " need attention";
  if ($("teamCountMetric")) $("teamCountMetric").textContent = store.team.length;
  if ($("teamOverMetric"))
    $("teamOverMetric").textContent =
      store.team.filter((m) => openCountFor(m.id) / m.capacity >= 1).length +
      " overloaded";

  renderTeamMini();
  renderTeamFull();
}

// ── DASHBOARD ACTIVE PROJECTS LIST ──────────────────────────────────────────
export function renderDashboardProjects() {
  const el = $("dashProjects");
  if (!el) return;
  const ranked = [...store.projects].sort(
    (a, b) =>
      ["critical", "high", "mid", "low"].indexOf(a.priority) -
      ["critical", "high", "mid", "low"].indexOf(b.priority)
  );
  el.innerHTML = ranked
    .map(
      (p) => `
    <div class="project-row" data-action="goprojects">
      <div class="proj-dot" style="background:${esc(p.color)}"></div>
      <div class="proj-info">
        <div class="proj-name">${esc(p.name)}</div>
        <div class="proj-meta">${esc(p.url)} · ${openCountForProject(
        p.id
      )} tasks open</div>
      </div>
      <div class="proj-bar-wrap">
        <div class="proj-bar"><div class="proj-fill" style="width:${
          p.health
        }%;background:${esc(p.color)}"></div></div>
        <div class="proj-pct">${p.health}%</div>
      </div>
      <span class="priority-tag ${PRIO_CLASS[p.priority]}">${esc(
        p.priority
      )}</span>
    </div>`
    )
    .join("");
}

export function renderAll() {
  renderDashboardProjects();
  renderProjects();
  renderMoneyPages();
  renderTasks();
}
