import type { AppData, PriorityDefinition, StatusDefinition } from "../types/models";

const now = new Date().toISOString();

export const defaultPriorities: PriorityDefinition[] = [
  { id: "priority-low", name: "Thấp", color: "#65a77a", weight: 10, sortOrder: 0, isDefault: false, createdAt: now, updatedAt: now, deletedAt: null },
  { id: "priority-medium", name: "Vừa", color: "#d5a645", weight: 20, sortOrder: 1, isDefault: true, createdAt: now, updatedAt: now, deletedAt: null },
  { id: "priority-high", name: "Cao", color: "#e47457", weight: 30, sortOrder: 2, isDefault: false, createdAt: now, updatedAt: now, deletedAt: null },
  { id: "priority-urgent", name: "Khẩn cấp", color: "#c24f6f", weight: 40, sortOrder: 3, isDefault: false, createdAt: now, updatedAt: now, deletedAt: null },
];

export const defaultStatuses: StatusDefinition[] = [
  { id: "status-complete", name: "Hoàn thành", color: "#7667dc", weight: 100, sortOrder: 0, isCompletionStatus: true, isSystem: true, createdAt: now, updatedAt: now, deletedAt: null },
];

export function createSeedData(): AppData {
  return {
    procedures: [], projects: [], tasks: [],
    priorities: defaultPriorities.map((item) => ({ ...item })),
    statuses: defaultStatuses.map((item) => ({ ...item })),
    auditEvents: [],
    settings: { theme: "system", fontScale: 1, alwaysOnTop: true, autostart: false, calendarCollapsed: false, miniMode: false, exclusiveCompletion: false, onboardingCompleted: false },
  };
}
