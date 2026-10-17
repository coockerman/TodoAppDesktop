import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { createSeedData } from "../../data/seed";
import { useMorrowStore } from "../../stores/useMorrowStore";
import { MoveTasksDialog } from "./MoveTasksDialog";
afterEach(cleanup);
beforeEach(() => {
  const data = createSeedData();
  const template = data.tasks[1];
  useMorrowStore.setState({ ...data, selectedDate: "2026-10-16", tasks: [
    { ...template, id: "old", title: "Việc cũ", scheduledDate: "2026-10-10" },
    { ...template, id: "future", title: "Việc tương lai", scheduledDate: "2026-10-20" },
    { ...template, id: "backlog", title: "Việc backlog", scheduledDate: null },
    { ...template, id: "done", title: "Việc Done", scheduledDate: "2026-10-09", completedAt: "2026-10-09T10:00:00Z" },
  ], hydrated: true });
});
it("lists previous unfinished work without backlog and allows moving newer work backwards", () => {
  render(<MoveTasksDialog onClose={() => {}} />);
  expect(screen.getByText("Việc cũ")).toBeInTheDocument();
  expect(screen.queryByText("Việc Done")).not.toBeInTheDocument();
  expect(screen.queryByText("Việc backlog")).not.toBeInTheDocument();
  expect(screen.queryByText("Việc tương lai")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Phạm vi chuyển việc"), { target: { value: "all" } });
  fireEvent.click(screen.getByRole("button", { name: "Chuyển Việc tương lai sang 2026-10-16" }));
  expect(useMorrowStore.getState().tasks.find(t => t.id === "future")?.scheduledDate).toBe("2026-10-16");
  expect(screen.queryByText("Việc tương lai")).not.toBeInTheDocument();
});
it("protects Done dates and backlog even when store actions are called directly", () => {
  const state = useMorrowStore.getState();
  state.scheduleTask("done", "2026-01-01");
  state.unscheduleTask("done");
  state.bulkMoveOpenTasks("2026-10-09", "2026-01-01");
  expect(useMorrowStore.getState().tasks.find(t => t.id === "done")?.scheduledDate).toBe("2026-10-09");
  expect(useMorrowStore.getState().auditEvents).toHaveLength(0);
});
