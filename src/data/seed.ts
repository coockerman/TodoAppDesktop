import { format } from "date-fns";
import type { AppData, PriorityDefinition, StatusDefinition } from "../types/models";

const now = new Date().toISOString();

export const defaultPriorities: PriorityDefinition[] = [
  { id: "priority-low", name: "Thấp", color: "#65a77a", weight: 10, sortOrder: 0, isDefault: false, createdAt: now, updatedAt: now, deletedAt: null },
  { id: "priority-medium", name: "Vừa", color: "#d5a645", weight: 20, sortOrder: 1, isDefault: true, createdAt: now, updatedAt: now, deletedAt: null },
  { id: "priority-high", name: "Cao", color: "#e47457", weight: 30, sortOrder: 2, isDefault: false, createdAt: now, updatedAt: now, deletedAt: null },
  { id: "priority-urgent", name: "Khẩn cấp", color: "#c24f6f", weight: 40, sortOrder: 3, isDefault: false, createdAt: now, updatedAt: now, deletedAt: null },
];

export const defaultStatuses: StatusDefinition[] = [
  { id: "status-todo", name: "Todo", color: "#4f8bc9", weight: 10, sortOrder: 0, isCompletionStatus: false, isSystem: true, createdAt: now, updatedAt: now, deletedAt: null },
  { id: "status-complete", name: "Done", color: "#7667dc", weight: 100, sortOrder: 1, isCompletionStatus: true, isSystem: true, createdAt: now, updatedAt: now, deletedAt: null },
];

export function createSeedData(): AppData {
  return {
    procedures: [],
    projects: [{ id: "project-demo", name: "dự án Demo", description: "Thử thêm việc và xếp lịch tại đây.", color: "#7667dc", sortOrder: 0, archived: false, createdAt: now, updatedAt: now, deletedAt: null }],
    tasks: ["Làm quen với Morrow", "Thêm công việc đầu tiên", "Thử xếp lịch từ Backlog"].map((title, index) => ({ id: `task-demo-${index}`, projectId: "project-demo", title, notes: "", scheduledDate: index === 2 ? null : format(new Date(), "yyyy-MM-dd"), priorityId: "priority-medium", sortOrder: index, statuses: defaultStatuses.map(item => ({ statusId: item.id, checked: index === 0 ? item.isCompletionStatus : !item.isCompletionStatus, checkedAt: (index === 0 ? item.isCompletionStatus : !item.isCompletionStatus) ? now : null, updatedAt: now })), completedAt: index === 0 ? now : null, createdAt: now, updatedAt: now, deletedAt: null })),
    priorities: defaultPriorities.map((item) => ({ ...item })),
    statuses: defaultStatuses.map((item) => ({ ...item })),
    auditEvents: [],
    settings: { theme: "system", fontScale: 1, alwaysOnTop: true, autostart: false, calendarCollapsed: false, miniMode: false, exclusiveCompletion: false, onboardingCompleted: false },
  };
}
