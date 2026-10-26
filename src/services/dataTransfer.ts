import type { AppData } from "../types/models";
export type ExportMode = "backup" | "projects" | "project" | "completed" | "procedures";
export interface TaskDateFilter { from: string; to: string; includeBacklog?: boolean }
export function filterTaskDates(data: AppData, dates?: TaskDateFilter): AppData {
  if (!dates) return data;
  if (!dates.from || !dates.to || dates.from > dates.to) throw new Error("Khoảng ngày không hợp lệ.");
  const tasks = data.tasks.filter(task => !task.deletedAt && (task.scheduledDate
    ? task.scheduledDate >= dates.from && task.scheduledDate <= dates.to
    : !!dates.includeBacklog));
  const ids = new Set(tasks.map(task => task.projectId));
  return { ...data, tasks, projects: data.projects.filter(project => ids.has(project.id)), auditEvents: [] };
}
export function selectExportData(data: AppData, mode: ExportMode, projectId: string, dates?: TaskDateFilter): AppData {
  if (mode === "backup") return data;
  if (mode === "procedures") return { ...data, projects: [], tasks: [], auditEvents: [], procedures: data.procedures.filter(item => !item.deletedAt) };
  const projects = data.projects.filter(item => !item.deletedAt && (mode !== "project" || item.id === projectId));
  const ids = new Set(projects.map(item => item.id));
  const tasks = data.tasks.filter(item => !item.deletedAt && ids.has(item.projectId) && (mode !== "completed" || !!item.completedAt));
  return filterTaskDates({ ...data, projects, tasks, procedures: [], auditEvents: [] }, dates);
}
export function mergeImport(current: AppData, incoming: AppData, tasksOnly = false): AppData {
  const merge = <T extends { id: string }>(existing: T[], next: T[]): T[] => [...existing, ...next.filter(item => !existing.some(old => old.id === item.id))];
  return { ...current, projects: merge(current.projects, incoming.projects), tasks: merge(current.tasks, incoming.tasks), priorities: merge(current.priorities, incoming.priorities), statuses: merge(current.statuses, incoming.statuses), procedures: tasksOnly ? current.procedures : merge(current.procedures, incoming.procedures) };
}

export function mergeProcedures(current: AppData, incoming: AppData): AppData {
  return { ...current, procedures: [...current.procedures, ...incoming.procedures.filter(item => !item.deletedAt && !current.procedures.some(existing => existing.id === item.id))] };
}
