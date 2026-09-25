import { create } from "zustand";
import { format } from "date-fns";
import { createId, sessionId } from "../lib/id";
import { loadData, persistData } from "../services/storage";
import type {
  AppData,
  AppSettings,
  AuditEvent,
  PriorityDefinition,
  Project,
  StatusDefinition,
  Task,
} from "../types/models";

type EntityType = AuditEvent["entityType"];
type AppState = AppData & {
  hydrated: boolean;
  selectedDate: string;
  hydrate: () => Promise<void>;
  replaceData: (data: AppData) => void;
  selectDate: (date: string) => void;
  addTask: (projectId: string, title: string, date?: string) => void;
  updateTask: (taskId: string, patch: Partial<Pick<Task, "title" | "notes" | "priorityId">>) => void;
  toggleStatus: (taskId: string, statusId: string) => void;
  deleteTask: (taskId: string) => void;
  bulkMoveOpenTasks: (fromDate: string, toDate: string) => number;
  addProject: (name: string, color: string) => void;
  updateProject: (projectId: string, patch: Partial<Pick<Project, "name" | "description" | "color" | "archived">>) => void;
  deleteProject: (projectId: string) => void;
  addPriority: (name: string, color: string) => void;
  updatePriority: (id: string, patch: Partial<Pick<PriorityDefinition, "name" | "color" | "weight">>) => void;
  deletePriority: (id: string) => void;
  addStatus: (name: string, color: string) => void;
  updateStatus: (id: string, patch: Partial<Pick<StatusDefinition, "name" | "color" | "weight">>) => void;
  deleteStatus: (id: string) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
};

const emptyData: AppData = {
  projects: [], tasks: [], priorities: [], statuses: [], auditEvents: [],
  settings: { theme: "system", fontScale: 1, alwaysOnTop: true, autostart: false, calendarCollapsed: false, miniMode: false },
};

const now = () => new Date().toISOString();
const audit = (entityType: EntityType, entityId: string, eventType: string, before: unknown, after: unknown, metadata: Record<string, unknown> = {}): AuditEvent => ({
  id: createId("event"), entityType, entityId, eventType, occurredAt: now(), actor: "user", sessionId, before, after, metadata,
});

let persistChain = Promise.resolve();
let hydrationPromise: Promise<AppData> | null = null;
const save = (state: AppState) => {
  const data: AppData = {
    projects: state.projects,
    tasks: state.tasks,
    priorities: state.priorities,
    statuses: state.statuses,
    auditEvents: state.auditEvents,
    settings: state.settings,
  };
  persistChain = persistChain.then(() => persistData(data)).catch(console.error);
};

export const useMorrowStore = create<AppState>((set, get) => {
  const commit = (updater: (state: AppState) => Partial<AppState>) => {
    set((state) => updater(state));
    save(get());
  };

  return {
    ...emptyData,
    hydrated: false,
    selectedDate: format(new Date(), "yyyy-MM-dd"),

    hydrate: async () => {
      hydrationPromise ??= loadData();
      set({ ...(await hydrationPromise), hydrated: true });
    },
    replaceData: (data) => {
      const event = audit("import", "database", "imported", null, { counts: { projects: data.projects.length, tasks: data.tasks.length } });
      set({ ...data, auditEvents: [...data.auditEvents, event], hydrated: true });
      save(get());
    },
    selectDate: (selectedDate) => set({ selectedDate }),

    addTask: (projectId, title, date) => commit((state) => {
      const createdAt = now();
      const task: Task = {
        id: createId("task"), projectId, title: title.trim(), notes: "",
        scheduledDate: date ?? state.selectedDate,
        priorityId: state.priorities.find((item) => item.isDefault && !item.deletedAt)?.id ?? state.priorities[0]?.id ?? "",
        sortOrder: state.tasks.filter((item) => item.scheduledDate === (date ?? state.selectedDate)).length,
        statuses: state.statuses.filter((item) => !item.deletedAt).map((item) => ({ statusId: item.id, checked: false, checkedAt: null, updatedAt: createdAt })),
        completedAt: null, createdAt, updatedAt: createdAt, deletedAt: null,
      };
      return { tasks: [...state.tasks, task], auditEvents: [...state.auditEvents, audit("task", task.id, "created", null, task)] };
    }),
    updateTask: (taskId, patch) => commit((state) => {
      const before = state.tasks.find((item) => item.id === taskId);
      if (!before) return {};
      const after = { ...before, ...patch, updatedAt: now() };
      return { tasks: state.tasks.map((item) => item.id === taskId ? after : item), auditEvents: [...state.auditEvents, audit("task", taskId, "updated", before, after)] };
    }),
    toggleStatus: (taskId, statusId) => commit((state) => {
      const before = state.tasks.find((item) => item.id === taskId);
      if (!before) return {};
      const stamp = now();
      const statuses = state.statuses.filter((item) => !item.deletedAt);
      const current = before.statuses.find((item) => item.statusId === statusId);
      const checked = !current?.checked;
      const values = statuses.map((definition) => {
        const value = before.statuses.find((item) => item.statusId === definition.id);
        if (definition.id === statusId) return { statusId, checked, checkedAt: checked ? stamp : null, updatedAt: stamp };
        return value ?? { statusId: definition.id, checked: false, checkedAt: null, updatedAt: stamp };
      });
      const completion = statuses.find((item) => item.isCompletionStatus);
      const completedAt = completion?.id === statusId ? (checked ? stamp : null) : before.completedAt;
      const after = { ...before, statuses: values, completedAt, updatedAt: stamp };
      return { tasks: state.tasks.map((item) => item.id === taskId ? after : item), auditEvents: [...state.auditEvents, audit("task", taskId, checked ? "status_checked" : "status_unchecked", before, after, { statusId })] };
    }),
    deleteTask: (taskId) => commit((state) => {
      const before = state.tasks.find((item) => item.id === taskId);
      if (!before) return {};
      const after = { ...before, deletedAt: now(), updatedAt: now() };
      return { tasks: state.tasks.map((item) => item.id === taskId ? after : item), auditEvents: [...state.auditEvents, audit("task", taskId, "deleted", before, after)] };
    }),
    bulkMoveOpenTasks: (fromDate, toDate) => {
      const movable = get().tasks.filter((item) => item.scheduledDate === fromDate && !item.completedAt && !item.deletedAt);
      if (!movable.length || fromDate === toDate) return 0;
      const batchId = createId("move");
      commit((state) => {
        const stamp = now();
        const ids = new Set(movable.map((item) => item.id));
        const moved = state.tasks.map((item) => ids.has(item.id) ? { ...item, scheduledDate: toDate, updatedAt: stamp } : item);
        const events = movable.map((item) => audit("task", item.id, "date_moved", item, { ...item, scheduledDate: toDate, updatedAt: stamp }, { fromDate, toDate, moveBatchId: batchId }));
        return { tasks: moved, auditEvents: [...state.auditEvents, ...events] };
      });
      return movable.length;
    },

    addProject: (name, color) => commit((state) => {
      const stamp = now();
      const project: Project = { id: createId("project"), name: name.trim(), description: "", color, sortOrder: state.projects.length, archived: false, createdAt: stamp, updatedAt: stamp, deletedAt: null };
      return { projects: [...state.projects, project], auditEvents: [...state.auditEvents, audit("project", project.id, "created", null, project)] };
    }),
    updateProject: (projectId, patch) => commit((state) => {
      const before = state.projects.find((item) => item.id === projectId);
      if (!before) return {};
      const after = { ...before, ...patch, updatedAt: now() };
      return { projects: state.projects.map((item) => item.id === projectId ? after : item), auditEvents: [...state.auditEvents, audit("project", projectId, "updated", before, after)] };
    }),
    deleteProject: (projectId) => commit((state) => {
      const before = state.projects.find((item) => item.id === projectId);
      if (!before) return {};
      const stamp = now();
      const after = { ...before, deletedAt: stamp, updatedAt: stamp };
      return {
        projects: state.projects.map((item) => item.id === projectId ? after : item),
        tasks: state.tasks.map((item) => item.projectId === projectId && !item.deletedAt ? { ...item, deletedAt: stamp, updatedAt: stamp } : item),
        auditEvents: [...state.auditEvents, audit("project", projectId, "deleted", before, after)],
      };
    }),

    addPriority: (name, color) => commit((state) => {
      const stamp = now();
      const item: PriorityDefinition = { id: createId("priority"), name: name.trim(), color, weight: (Math.max(0, ...state.priorities.map((p) => p.weight)) + 10), sortOrder: state.priorities.length, isDefault: false, createdAt: stamp, updatedAt: stamp, deletedAt: null };
      return { priorities: [...state.priorities, item], auditEvents: [...state.auditEvents, audit("priority", item.id, "created", null, item)] };
    }),
    updatePriority: (id, patch) => commit((state) => {
      const before = state.priorities.find((item) => item.id === id); if (!before) return {};
      const after = { ...before, ...patch, updatedAt: now() };
      return { priorities: state.priorities.map((item) => item.id === id ? after : item), auditEvents: [...state.auditEvents, audit("priority", id, "updated", before, after)] };
    }),
    deletePriority: (id) => commit((state) => {
      const before = state.priorities.find((item) => item.id === id); if (!before || before.isDefault) return {};
      const after = { ...before, deletedAt: now(), updatedAt: now() };
      return { priorities: state.priorities.map((item) => item.id === id ? after : item), auditEvents: [...state.auditEvents, audit("priority", id, "deleted", before, after)] };
    }),
    addStatus: (name, color) => commit((state) => {
      const stamp = now();
      const item: StatusDefinition = { id: createId("status"), name: name.trim(), color, weight: (Math.max(0, ...state.statuses.map((p) => p.weight)) + 10), sortOrder: state.statuses.length, isCompletionStatus: false, isSystem: false, createdAt: stamp, updatedAt: stamp, deletedAt: null };
      return { statuses: [...state.statuses, item], auditEvents: [...state.auditEvents, audit("status", item.id, "created", null, item)] };
    }),
    updateStatus: (id, patch) => commit((state) => {
      const before = state.statuses.find((item) => item.id === id); if (!before) return {};
      const after = { ...before, ...patch, updatedAt: now() };
      return { statuses: state.statuses.map((item) => item.id === id ? after : item), auditEvents: [...state.auditEvents, audit("status", id, "updated", before, after)] };
    }),
    deleteStatus: (id) => commit((state) => {
      const before = state.statuses.find((item) => item.id === id); if (!before || before.isSystem) return {};
      const after = { ...before, deletedAt: now(), updatedAt: now() };
      return { statuses: state.statuses.map((item) => item.id === id ? after : item), auditEvents: [...state.auditEvents, audit("status", id, "deleted", before, after)] };
    }),
    updateSettings: (patch) => commit((state) => ({ settings: { ...state.settings, ...patch }, auditEvents: [...state.auditEvents, audit("settings", "app", "updated", state.settings, { ...state.settings, ...patch })] })),
  };
});
