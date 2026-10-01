import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSeedData } from "../../data/seed";
import { useMorrowStore } from "../../stores/useMorrowStore";
import { TaskPanel } from "./TaskPanel";

afterEach(cleanup);
beforeEach(() => useMorrowStore.setState({ ...createSeedData(), tasks: [], selectedDate: "2026-10-01", hydrated: true }));

describe("Calendar continuous entry", () => {
  it("keeps the same input focused after the first and subsequent tasks on an empty day", () => {
    render(<TaskPanel onManageProjects={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Morrow Launch" }));
    const input = screen.getByRole("textbox", { name: "Thêm việc vào Morrow Launch" });
    expect(screen.getAllByRole("textbox", { name: "Thêm việc vào Morrow Launch" })).toHaveLength(1);
    input.focus();
    for (const title of ["Ra game mới", "Upload build"]) {
      fireEvent.change(input, { target: { value: title } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(input).toHaveValue("");
      expect(input).toHaveFocus();
    }
    expect(useMorrowStore.getState().tasks.map((task) => task.title)).toEqual(["Ra game mới", "Upload build"]);
    expect(useMorrowStore.getState().tasks.every((task) => task.scheduledDate === "2026-10-01")).toBe(true);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(useMorrowStore.getState().tasks).toHaveLength(2);
  });
  it("does not submit while the input method is composing", () => {
    render(<TaskPanel onManageProjects={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Morrow Launch" }));
    const input = screen.getByRole("textbox", { name: "Thêm việc vào Morrow Launch" });
    fireEvent.change(input, { target: { value: "Việc mới" } });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(useMorrowStore.getState().tasks).toHaveLength(0);
    expect(input).toHaveValue("Việc mới");
  });
});
