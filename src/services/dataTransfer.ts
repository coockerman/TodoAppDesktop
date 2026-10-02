import type { AppData } from "../types/models";
export type ExportMode = "backup" | "projects" | "project" | "completed";
export function selectExportData(data: AppData, mode: ExportMode, projectId: string): AppData {
  if (mode === "backup") return data;
  const projects = data.projects.filter(item => !item.deletedAt && (mode !== "project" || item.id === projectId));
  const ids = new Set(projects.map(item => item.id));
  const tasks = data.tasks.filter(item => !item.deletedAt && ids.has(item.projectId) && (mode !== "completed" || !!item.completedAt));
  return { ...data, projects, tasks, procedures: [], auditEvents: [] };
}
export function mergeImport(current: AppData, incoming: AppData, tasksOnly = false): AppData {
  const merge = <T extends { id: string }>(existing: T[], next: T[]): T[] => [...existing, ...next.filter(item => !existing.some(old => old.id === item.id))];
  return { ...current, projects: merge(current.projects, incoming.projects), tasks: merge(current.tasks, incoming.tasks), priorities: merge(current.priorities, incoming.priorities), statuses: merge(current.statuses, incoming.statuses), procedures: tasksOnly ? current.procedures : merge(current.procedures, incoming.procedures) };
}
