import { beforeEach, describe, expect, it } from "vitest";
import { createSeedData } from "../data/seed";
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
    const moved = useMorrowStore.getState().bulkMoveOpenTasks("2026-09-25", "2026-09-28");
    const state = useMorrowStore.getState();
    expect(moved).toBe(2);
    const events = state.auditEvents.filter((event) => event.eventType === "date_moved");
    expect(new Set(events.map((event) => event.metadata.moveBatchId)).size).toBe(1);
    expect(state.tasks.filter((task) => task.scheduledDate === "2026-09-28")).toHaveLength(2);
  });

  it("soft-deletes tasks and preserves their record", () => {
    useMorrowStore.getState().deleteTask("task-calendar");
    const task = useMorrowStore.getState().tasks.find((item) => item.id === "task-calendar");
    expect(task?.deletedAt).toBeTruthy();
    expect(useMorrowStore.getState().auditEvents.at(-1)?.eventType).toBe("deleted");
  });
});
