import { beforeEach, describe, expect, it } from "vitest";
import { createDemoData as createSeedData } from "../test/fixtures";
import { useMorrowStore } from "./useMorrowStore";

describe("Morrow task workflow", () => {
  beforeEach(() => {
    useMorrowStore.setState({ ...createSeedData(), selectedDate: "2026-09-25", hydrated: true });
  });

  it("records a completion event", () => {
    useMorrowStore.getState().toggleStatus("task-calendar", "status-complete");
    const state = useMorrowStore.getState();
    expect(state.tasks.find((task) => task.id === "task-calendar")?.completedAt).toBeTruthy();
    expect(state.auditEvents.at(-1)?.eventType).toBe("status_checked");
  });

  it("moves every open task as one audited batch", () => {
    const sourceDate = useMorrowStore.getState().tasks.find((task) => task.id === "task-calendar")!.scheduledDate!;
    const moved = useMorrowStore.getState().bulkMoveOpenTasks(sourceDate, "2026-10-28");
    const state = useMorrowStore.getState();
    expect(moved).toBe(2);
    const events = state.auditEvents.filter((event) => event.eventType === "date_moved");
    expect(new Set(events.map((event) => event.metadata.moveBatchId)).size).toBe(1);
    expect(state.tasks.filter((task) => task.scheduledDate === "2026-10-28")).toHaveLength(2);
  });

  it("soft-deletes tasks and preserves their record", () => {
    useMorrowStore.getState().deleteTask("task-calendar");
    const task = useMorrowStore.getState().tasks.find((item) => item.id === "task-calendar");
    expect(task?.deletedAt).toBeTruthy();
    expect(useMorrowStore.getState().auditEvents.at(-1)?.eventType).toBe("deleted");
  });

  it("clears other status checks when exclusive completion is enabled", () => {
    const store = useMorrowStore.getState();
    store.addStatus("Đang xử lý", "#4f8bc9");
    const customStatus = useMorrowStore.getState().statuses.find((status) => status.name === "Đang xử lý")!;
    useMorrowStore.getState().toggleStatus("task-calendar", customStatus.id);
    useMorrowStore.getState().updateSettings({ exclusiveCompletion: true });
    useMorrowStore.getState().toggleStatus("task-calendar", "status-complete");

    const task = useMorrowStore.getState().tasks.find((item) => item.id === "task-calendar")!;
    expect(task.statuses.find((status) => status.statusId === "status-complete")?.checked).toBe(true);
    expect(task.statuses.find((status) => status.statusId === customStatus.id)?.checked).toBe(false);
  });

  it("permanently purges soft-deleted projects and their related data", () => {
    useMorrowStore.getState().deleteProject("project-morrow");
    const result = useMorrowStore.getState().purgeDeletedData();
    const state = useMorrowStore.getState();

    expect(result.projects).toBe(1);
    expect(result.tasks).toBe(2);
    expect(state.projects.some((project) => project.id === "project-morrow")).toBe(false);
    expect(state.tasks.some((task) => task.projectId === "project-morrow")).toBe(false);
    expect(state.auditEvents.some((event) => event.entityId === "project-morrow")).toBe(false);
  });

  it("moves a task between project backlog and a scheduled day", () => {
    useMorrowStore.getState().addBacklogTask("project-morrow", "Việc làm sau");
    const backlogTask = useMorrowStore.getState().tasks.find((task) => task.title === "Việc làm sau")!;
    expect(backlogTask.scheduledDate).toBeNull();

    useMorrowStore.getState().scheduleTask(backlogTask.id, "2026-10-02");
    expect(useMorrowStore.getState().tasks.find((task) => task.id === backlogTask.id)?.scheduledDate).toBe("2026-10-02");
    expect(useMorrowStore.getState().auditEvents.at(-1)?.eventType).toBe("scheduled");

    useMorrowStore.getState().unscheduleTask(backlogTask.id);
    expect(useMorrowStore.getState().tasks.find((task) => task.id === backlogTask.id)?.scheduledDate).toBeNull();
    expect(useMorrowStore.getState().auditEvents.at(-1)?.eventType).toBe("unscheduled");
  });

  it("swaps task order only inside the same project and day", () => {
    useMorrowStore.getState().addTask("project-morrow", "Việc thứ nhất", "2026-09-25");
    useMorrowStore.getState().addTask("project-morrow", "Việc thứ hai", "2026-09-25");
    const state = useMorrowStore.getState();
    const projectTasks = state.tasks.filter((task) => task.projectId === "project-morrow" && task.scheduledDate === "2026-09-25" && !task.deletedAt);
    const [first, second] = projectTasks.sort((a, b) => a.sortOrder - b.sortOrder);

    state.reorderTask(first.id, second.id);

    const reordered = useMorrowStore.getState();
    expect(reordered.tasks.find((task) => task.id === first.id)?.sortOrder).toBe(second.sortOrder);
    expect(reordered.tasks.find((task) => task.id === second.id)?.sortOrder).toBe(first.sortOrder);
    expect(reordered.auditEvents.at(-1)?.eventType).toBe("reordered");
  });
});
