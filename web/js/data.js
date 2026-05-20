// All database reads/writes for the workspace.
import { supabase } from "./supabaseClient.js";

// In-memory caches kept fresh by realtime + refetch after writes.
export const store = {
  projects: [],
  team: [],
  tasks: [],
  moneyPages: [],
};

export async function loadAll() {
  const [projects, team, tasks, moneyPages] = await Promise.all([
    supabase.from("projects").select("*").order("created_at"),
    supabase.from("team_members").select("*").order("created_at"),
    supabase.from("tasks").select("*").order("created_at"),
    supabase.from("money_pages").select("*").order("position"),
  ]);
  store.projects = projects.data || [];
  store.team = team.data || [];
  store.tasks = tasks.data || [];
  store.moneyPages = moneyPages.data || [];
}

export async function refreshTasks() {
  const { data } = await supabase.from("tasks").select("*").order("created_at");
  store.tasks = data || [];
}

// ── lookups ──────────────────────────────────────────────────────────────
export const projectById = (id) => store.projects.find((p) => p.id === id);
export const teamById = (id) => store.team.find((m) => m.id === id);
export const teamByName = (name) => store.team.find((m) => m.name === name);
export const projectByName = (name) =>
  store.projects.find((p) => p.name === name);

// ── task CRUD ──────────────────────────────────────────────────────────────
export async function createTask(t) {
  const { data, error } = await supabase
    .from("tasks")
    .insert(t)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(id, patch) {
  const { error } = await supabase.from("tasks").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleTaskDone(id, done) {
  return updateTask(id, { done });
}

// Delegate = reassign to a different team member.
export async function reassignTask(id, assigneeId) {
  return updateTask(id, { assignee_id: assigneeId });
}
