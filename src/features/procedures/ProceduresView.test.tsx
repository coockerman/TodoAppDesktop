import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { createSeedData } from "../../data/seed";
import { useMorrowStore } from "../../stores/useMorrowStore";
import { ProceduresView } from "./ProceduresView";

afterEach(cleanup);
beforeEach(() => useMorrowStore.setState({ ...createSeedData(), hydrated: true }));

it("creates, pastes, reorders, edits, ticks, resets, duplicates and restores a deleted procedure", () => {
  render(<ProceduresView />);
  fireEvent.change(screen.getByLabelText("Tên bộ quy trình mới"), { target: { value: "Ra game" } });
  fireEvent.click(screen.getByLabelText("Tạo bộ quy trình"));
  const input = screen.getByLabelText("Thêm bước quy trình");
  fireEvent.paste(input, { clipboardData: { getData: () => "Build\n\nUpload\r\nKiểm tra" } });
  expect(useMorrowStore.getState().procedures[0].steps.map((step) => step.title)).toEqual(["Build", "Upload", "Kiểm tra"]);
  fireEvent.click(screen.getByLabelText("Đưa bước 2 lên"));
  const title = screen.getByLabelText("Tên bước 1");
  fireEvent.change(title, { target: { value: "Upload game" } });
  fireEvent.blur(title);
  fireEvent.click(screen.getByLabelText("Hoàn thành: Upload game"));
  fireEvent.click(screen.getByRole("button", { name: "Reset" }));
  expect(screen.getByLabelText("Hoàn thành: Upload game")).not.toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "Hoàn tác" }));
  expect(screen.getByLabelText("Hoàn thành: Upload game")).toBeChecked();
  fireEvent.click(screen.getByLabelText("Thao tác quy trình"));
  fireEvent.click(screen.getByRole("button", { name: "Nhân bản" }));
  const [original, copy] = useMorrowStore.getState().procedures;
  expect(copy.steps.every((step) => !step.checked)).toBe(true);
  expect(copy.steps.map((step) => step.title)).toEqual(original.steps.map((step) => step.title));
  expect(copy.steps[0].id).not.toBe(original.steps[0].id);
  fireEvent.click(screen.getByLabelText("Thao tác quy trình"));
  fireEvent.click(screen.getByRole("button", { name: "Xóa bộ" }));
  expect(useMorrowStore.getState().procedures[1].deletedAt).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Hoàn tác" }));
  expect(useMorrowStore.getState().procedures[1].deletedAt).toBeNull();
  expect(screen.getByLabelText("Tên bộ quy trình")).toHaveValue("Ra game (bản sao)");
});
