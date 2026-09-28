import Database from "@tauri-apps/plugin-sql";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { z } from "zod";
import { createSeedData } from "../data/seed";
import type { AppData, ExportPayload } from "../types/models";

const STORAGE_KEY = "morrow-app-data-v1";
const isTauri = () => "__TAURI_INTERNALS__" in window;
let database: Database | null = null;

const importSchema = z.object({
  schemaVersion: z.literal(1),
  app: z.literal("Morrow"),
  projects: z.array(z.unknown()),
  tasks: z.array(z.unknown()),
  priorities: z.array(z.unknown()),
  statuses: z.array(z.unknown()),
  auditEvents: z.array(z.unknown()),
  settings: z.object({
    theme: z.enum(["system", "light", "dark"]),
    fontScale: z.number().min(0.85).max(1.3).optional(),
    alwaysOnTop: z.boolean(),
    autostart: z.boolean(),
    calendarCollapsed: z.boolean(),
    miniMode: z.boolean(),
    exclusiveCompletion: z.boolean().optional(),
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
    console.warn("Không thể đọc dữ liệu Morrow, dùng dữ liệu demo.", error);
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
    input.click();
  });
}

function parseImport(content: string): AppData {
  const parsed = JSON.parse(content) as ExportPayload;
  importSchema.parse(parsed);
  return normalizeData({
    projects: parsed.projects,
    tasks: parsed.tasks,
    priorities: parsed.priorities,
    statuses: parsed.statuses,
    auditEvents: parsed.auditEvents,
    settings: parsed.settings,
  } as AppData);
}

function normalizeData(data: AppData): AppData {
  return {
    ...data,
    tasks: data.tasks.map((task) => ({ ...task, scheduledDate: task.scheduledDate ?? null })),
    settings: {
      ...data.settings,
      fontScale: data.settings.fontScale ?? 1,
      exclusiveCompletion: data.settings.exclusiveCompletion ?? false,
    },
  };
}
