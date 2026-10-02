import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { createSeedData } from "../data/seed";
import { useMorrowStore } from "../stores/useMorrowStore";
import { TaskStatusSelect } from "./TaskStatusSelect";
afterEach(cleanup);
it("uses a native single-select and updates completion", () => {
  const data = createSeedData();
  useMorrowStore.setState(data);
  render(<TaskStatusSelect task={data.tasks[1]} />);
  const select = screen.getByRole("combobox");
  expect(select).toHaveValue("status-todo");
  expect(select).not.toHaveAttribute("multiple");
  fireEvent.change(select, { target: { value: "status-complete" } });
  expect(useMorrowStore.getState().tasks[1].completedAt).toBeTruthy();
  expect(useMorrowStore.getState().tasks[1].statuses.filter(item => item.checked)).toHaveLength(1);
});
