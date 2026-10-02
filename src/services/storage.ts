import { getTaskStatus } from "../lib/taskStatus";
import Database from "@tauri-apps/plugin-sql";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { z } from "zod";
import { createSeedData, defaultStatuses } from "../data/seed";
import type { AppData, ExportPayload } from "../types/models";

const STORAGE_KEY = "morrow-app-data-v1";
const isTauri = () => "__TAURI_INTERNALS__" in window;
let database: Database | null = null;

const stampFields = { id: z.string().min(1), createdAt: z.string(), updatedAt: z.string(), deletedAt: z.string().nullable() };
const projectSchema = z.object({ ...stampFields, name: z.string(), description: z.string(), color: z.string(), sortOrder: z.number().finite(), archived: z.boolean() });
const taskSchema = z.object({ ...stampFields, projectId: z.string(), title: z.string(), notes: z.string(), scheduledDate: z.string().nullable().optional(), priorityId: z.string(), sortOrder: z.number().finite(), completedAt: z.string().nullable(), statuses: z.array(z.object({ statusId: z.string(), checked: z.boolean(), checkedAt: z.string().nullable(), updatedAt: z.string() })) });
const definitionFields = { ...stampFields, name: z.string(), color: z.string(), weight: z.number().finite(), sortOrder: z.number().finite() };
const importSchema = z.object({
  schemaVersion: z.literal(1),
  app: z.literal("Morrow"),
  procedures: z.array(z.object({
    id: z.string(), name: z.string(),
    steps: z.array(z.object({ id: z.string(), title: z.string(), checked: z.boolean(), images: z.array(z.string().regex(/^data:image\/(png|jpeg|gif|webp);base64,/)).optional() })),
    allowImages: z.boolean().optional(), allowMultiline: z.boolean().optional(),
    createdAt: z.string(), updatedAt: z.string(), deletedAt: z.string().nullable(),
  })).optional(),
  projects: z.array(projectSchema),
  tasks: z.array(taskSchema),
  priorities: z.array(z.object({ ...definitionFields, isDefault: z.boolean() })),
  statuses: z.array(z.object({ ...definitionFields, isCompletionStatus: z.boolean(), isSystem: z.boolean() })),
  auditEvents: z.array(z.unknown()),
  settings: z.object({
    theme: z.enum(["system", "light", "dark"]),
    fontScale: z.number().min(0.85).max(1.3).optional(),
    alwaysOnTop: z.boolean(),
    autostart: z.boolean(),
    calendarCollapsed: z.boolean(),
    miniMode: z.boolean(),
    exclusiveCompletion: z.boolean().optional(),
    onboardingCompleted: z.boolean().optional(),
  }),
});

async function getDatabase() {
  if (!database) database = await Database.load("sqlite:morrow.db");
  return database;
}

export async function loadData(): Promise<AppData> {
  try {
    if (isTauri()) {
      const db = await getDatabase();
      const rows = await db.select<Array<{ value_json: string }>>(
        "SELECT value_json FROM app_state WHERE key = $1 LIMIT 1",
        [STORAGE_KEY],
      );
      if (rows[0]) return normalizeData(JSON.parse(rows[0].value_json) as AppData);
    } else {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) return normalizeData(JSON.parse(cached) as AppData);
    }
  } catch (error) {
    console.warn("Không thể đọc dữ liệu Morrow.", error);
  }

  const seed = createSeedData();
  await persistData(seed);
  return seed;
}

export async function persistData(data: AppData): Promise<void> {
  const serialized = JSON.stringify(data);
  if (isTauri()) {
    const db = await getDatabase();
    await db.execute(
      `INSERT INTO app_state (key, value_json, updated_at)
       VALUES ($1, $2, $3)
       ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
      [STORAGE_KEY, serialized, new Date().toISOString()],
    );
  } else {
    localStorage.setItem(STORAGE_KEY, serialized);
  }
}

export function buildExportPayload(data: AppData): ExportPayload {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    app: "Morrow",
    ...data,
  };
}

export async function exportData(data: AppData): Promise<boolean> {
  const content = JSON.stringify(buildExportPayload(data), null, 2);
  if (isTauri()) {
    const path = await save({ defaultPath: `morrow-backup-${new Date().toISOString().slice(0, 10)}.json`, filters: [{ name: "Morrow JSON", extensions: ["json"] }] });
    if (!path) return false;
    await writeTextFile(path, content);
    return true;
  }

  const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `morrow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}

export async function importDataFromFile(): Promise<AppData | null> {
  if (isTauri()) {
    const path = await open({ multiple: false, filters: [{ name: "Morrow JSON", extensions: ["json"] }] });
    if (!path) return null;
    return parseImport(await readTextFile(path));
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      try {
        const file = input.files?.[0];
        resolve(file ? parseImport(await file.text()) : null);
      } catch (error) {
        reject(error);
      }
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export function parseImport(content: string): AppData {
  const parsed = JSON.parse(content) as ExportPayload;
  importSchema.parse(parsed);
  for (const items of [parsed.projects, parsed.tasks, parsed.priorities, parsed.statuses, parsed.procedures ?? []]) {
    if (new Set(items.map(item => item.id)).size !== items.length) throw new Error("ID bị trùng trong file.");
  }
  const projectIds = new Set(parsed.projects.map(item => item.id));
  const priorityIds = new Set(parsed.priorities.map(item => item.id));
  const statusIds = new Set(parsed.statuses.map(item => item.id));
  if (!parsed.statuses.some(item => item.isCompletionStatus && !item.deletedAt)) throw new Error("Thiếu trạng thái hoàn thành.");
  if (parsed.tasks.some(task => !projectIds.has(task.projectId) || !priorityIds.has(task.priorityId) || task.statuses.some(value => !statusIds.has(value.statusId)))) throw new Error("Liên kết dữ liệu không hợp lệ.");
  return normalizeData({
    procedures: parsed.procedures ?? [],
    projects: parsed.projects,
    tasks: parsed.tasks,
    priorities: parsed.priorities,
    statuses: parsed.statuses,
    auditEvents: parsed.auditEvents,
    settings: parsed.settings,
  } as AppData);
}

function normalizeData(data: AppData): AppData {
  const statuses = data.statuses.some(item => !item.deletedAt && !item.isCompletionStatus) ? data.statuses
    : [...data.statuses.filter(item => item.id !== "status-todo"), { ...defaultStatuses[0], deletedAt: null }];
  return {
    ...data,
    procedures: data.procedures ?? [],
    statuses,
    tasks: data.tasks.map(task => {
      const selected = getTaskStatus(task, statuses);
      const stamp = task.updatedAt;
      return { ...task, scheduledDate: task.scheduledDate ?? null,
        statuses: statuses.filter(item => !item.deletedAt).map(item => {
          const previous = task.statuses.find(value => value.statusId === item.id);
          const checked = item.id === selected?.id;
          return { statusId: item.id, checked, checkedAt: checked ? (previous?.checkedAt ?? stamp) : null, updatedAt: previous?.updatedAt ?? stamp };
        }), completedAt: selected?.isCompletionStatus ? (task.completedAt ?? stamp) : null };
    }),
    settings: {
      ...data.settings,
      fontScale: data.settings.fontScale ?? 1,
      exclusiveCompletion: data.settings.exclusiveCompletion ?? false,
      onboardingCompleted: data.settings.onboardingCompleted ?? true,
    },
  };
}
