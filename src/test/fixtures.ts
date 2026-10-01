import { addDays, format, startOfToday, subDays } from "date-fns";
import type { AppData, PriorityDefinition, Project, StatusDefinition, Task } from "../types/models";

const now = new Date().toISOString();
const day = (offset: number) => format(addDays(startOfToday(), offset), "yyyy-MM-dd");

export const defaultPriorities: PriorityDefinition[] = [
  { id: "priority-low", name: "Thấp", color: "#65a77a", weight: 10, sortOrder: 0, isDefault: false, createdAt: now, updatedAt: now, deletedAt: null },
  { id: "priority-medium", name: "Vừa", color: "#d5a645", weight: 20, sortOrder: 1, isDefault: true, createdAt: now, updatedAt: now, deletedAt: null },
  { id: "priority-high", name: "Cao", color: "#e47457", weight: 30, sortOrder: 2, isDefault: false, createdAt: now, updatedAt: now, deletedAt: null },
  { id: "priority-urgent", name: "Khẩn cấp", color: "#c24f6f", weight: 40, sortOrder: 3, isDefault: false, createdAt: now, updatedAt: now, deletedAt: null },
];

export const defaultStatuses: StatusDefinition[] = [
  { id: "status-complete", name: "Hoàn thành", color: "#7667dc", weight: 100, sortOrder: 0, isCompletionStatus: true, isSystem: true, createdAt: now, updatedAt: now, deletedAt: null },
];

const projects: Project[] = [
  { id: "project-morrow", name: "Morrow Launch", description: "Xây dựng phiên bản đầu tiên của Morrow", color: "#7667dc", sortOrder: 0, archived: false, createdAt: now, updatedAt: now, deletedAt: null },
  { id: "project-work", name: "Công việc", description: "Các đầu việc chính trong tuần", color: "#4f8bc9", sortOrder: 1, archived: false, createdAt: now, updatedAt: now, deletedAt: null },
  { id: "project-personal", name: "Cá nhân", description: "Thói quen và việc riêng", color: "#65a77a", sortOrder: 2, archived: false, createdAt: now, updatedAt: now, deletedAt: null },
];

const task = (id: string, projectId: string, title: string, date: string, priorityId: string, done = false): Task => ({
  id,
  projectId,
  title,
  notes: "",
  scheduledDate: date,
  priorityId,
  sortOrder: 0,
  statuses: [{ statusId: "status-complete", checked: done, checkedAt: done ? now : null, updatedAt: now }],
  completedAt: done ? now : null,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
});

export function createDemoData(): AppData {
  const tasks = [
    task("task-calendar", "project-morrow", "Hoàn thiện calendar shell", day(0), "priority-high"),
    task("task-schema", "project-morrow", "Chốt database schema", day(0), "priority-medium", true),
    task("task-report", "project-work", "Tổng hợp báo cáo tuần", day(-1), "priority-high"),
    task("task-meeting", "project-work", "Chuẩn bị nội dung họp", day(1), "priority-medium"),
    task("task-walk", "project-personal", "Đi bộ 30 phút", day(0), "priority-low"),
    task("task-read", "project-personal", "Đọc 20 trang sách", format(subDays(startOfToday(), 2), "yyyy-MM-dd"), "priority-low", true),
  ];

  return {
    procedures: [],
    projects,
    tasks,
    priorities: defaultPriorities,
    statuses: defaultStatuses,
    auditEvents: [],
    settings: { theme: "system", fontScale: 1, alwaysOnTop: true, autostart: false, calendarCollapsed: false, miniMode: false, exclusiveCompletion: false, onboardingCompleted: true },
  };
}
