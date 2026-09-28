export type ThemeMode = "system" | "light" | "dark";
export type CalendarView = "week" | "month";
export type AppView = "calendar" | "dashboard" | "projects" | "settings";

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  sortOrder: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PriorityDefinition {
  id: string;
  name: string;
  color: string;
  weight: number;
  sortOrder: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface StatusDefinition {
  id: string;
  name: string;
  color: string;
  weight: number;
  sortOrder: number;
  isCompletionStatus: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TaskStatusValue {
  statusId: string;
  checked: boolean;
  checkedAt: string | null;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  notes: string;
  scheduledDate: string | null;
  priorityId: string;
  sortOrder: number;
  statuses: TaskStatusValue[];
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AuditEvent {
  id: string;
  entityType: "task" | "project" | "priority" | "status" | "settings" | "import";
  entityId: string;
  eventType: string;
  occurredAt: string;
  actor: "user" | "system" | "import";
  sessionId: string;
  before: unknown;
  after: unknown;
  metadata: Record<string, unknown>;
}

export interface AppSettings {
  theme: ThemeMode;
  fontScale: number;
  alwaysOnTop: boolean;
  autostart: boolean;
  calendarCollapsed: boolean;
  miniMode: boolean;
  exclusiveCompletion: boolean;
}

export interface AppData {
  projects: Project[];
  tasks: Task[];
  priorities: PriorityDefinition[];
  statuses: StatusDefinition[];
  auditEvents: AuditEvent[];
  settings: AppSettings;
}

export interface ExportPayload extends AppData {
  schemaVersion: 1;
  exportedAt: string;
  timezone: string;
  app: "Morrow";
}
