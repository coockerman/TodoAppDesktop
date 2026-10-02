import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

it("keeps a paragraph as one step only when multiline is enabled and gates pasted images", async () => {
  const id = useMorrowStore.getState().addProcedure("Flow");
  render(<ProceduresView />);
  fireEvent.click(screen.getByLabelText("Cho phép viết nhiều dòng"));
  fireEvent.change(screen.getByLabelText("Thêm bước quy trình"), { target: { value: "First\nSecond" } });
  fireEvent.click(screen.getByRole("button", { name: /^Thêm$/ }));
  expect(useMorrowStore.getState().procedures.find(item => item.id === id)!.steps).toHaveLength(1);
  expect(screen.getByLabelText("Tên bước 1").tagName).toBe("TEXTAREA");
  const file = new File(["image"], "step.png", { type: "image/png" });
  const clipboardData = { items: [{ type: "image/png", getAsFile: () => file }], getData: () => "" };
  fireEvent.paste(screen.getByLabelText("Tên bước 1"), { clipboardData });
  expect(useMorrowStore.getState().procedures[0].steps[0].images).toBeUndefined();
  fireEvent.click(screen.getByLabelText("Cho phép dán ảnh vào bước"));
  fireEvent.paste(screen.getByLabelText("Tên bước 1"), { clipboardData });
  await waitFor(() => expect(useMorrowStore.getState().procedures[0].steps[0].images).toHaveLength(1));
  expect(screen.getByAltText("Ảnh bước 1")).toBeInTheDocument();
});

it("accepts clipboard files at the new step input and file selection at an existing step", async () => {
  const id = useMorrowStore.getState().addProcedure("Images");
  useMorrowStore.getState().updateProcedure(id, { allowImages: true });
  render(<ProceduresView />);
  const file = new File(["image"], "step.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Thêm bước quy trình"), { target: { value: "Screenshot" } });
  fireEvent.paste(screen.getByLabelText("Thêm bước quy trình"), { clipboardData: { items: [], files: [file], getData: () => "" } });
  await waitFor(() => expect(useMorrowStore.getState().procedures[0].steps).toHaveLength(1));
  expect(useMorrowStore.getState().procedures[0].steps[0].title).toBe("Screenshot");
  fireEvent.change(screen.getByLabelText("Chọn ảnh cho bước 1"), { target: { files: [file] } });
  await waitFor(() => expect(useMorrowStore.getState().procedures[0].steps[0].images).toHaveLength(2));
  fireEvent.click(screen.getByLabelText("Dán ảnh vào bước 1"));
  expect(screen.getByLabelText("Dán ảnh vào bước 1")).toHaveFocus();
});
it("shows a useful error for unsupported images without modifying the step", async () => {
  const id = useMorrowStore.getState().addProcedure("Images");
  useMorrowStore.getState().updateProcedure(id, { allowImages: true });
  render(<ProceduresView />);
  fireEvent.change(screen.getByLabelText("Thêm bước từ ảnh"), { target: { files: [new File(["bad"], "bad.bmp", { type: "image/bmp" })] } });
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("PNG"));
  expect(useMorrowStore.getState().procedures[0].steps).toHaveLength(0);
});
