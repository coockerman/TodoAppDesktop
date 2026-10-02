import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "../../app/App";
import { createSeedData } from "../../data/seed";
import { useMorrowStore } from "../../stores/useMorrowStore";
import { WelcomeGuide } from "./WelcomeGuide";

afterEach(cleanup);
beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  useMorrowStore.setState({ ...createSeedData(), hydrated: true, hydrate: vi.fn(async () => {}) });
});

it("shows four illustrated steps and supports back and start", () => {
  const start = vi.fn();
  render(<WelcomeGuide onClose={vi.fn()} onStart={start} />);
  expect(screen.getByRole("dialog")).toHaveAccessibleName("Bắt đầu với một dự án");
  expect(screen.getByRole("img")).toHaveAccessibleName("Minh họa tạo dự án Game A");
  fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
  expect(screen.getByRole("img")).toHaveAccessibleName("Minh họa nhập việc rồi nhấn Enter");
  fireEvent.click(screen.getByRole("button", { name: "Quay lại" }));
  expect(screen.getByRole("dialog")).toHaveAccessibleName("Bắt đầu với một dự án");
  for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole("button", { name: "Tiếp tục" }));
  expect(screen.getByRole("img")).toHaveAccessibleName("Minh họa checklist dùng lại với Reset");
  fireEvent.click(screen.getByRole("button", { name: "Bắt đầu" }));
  expect(start).toHaveBeenCalledOnce();
});

it("remembers skipping, keeps the Demo project, and reopens from Settings", () => {
  render(<App />);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Bỏ qua" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(useMorrowStore.getState().settings.onboardingCompleted).toBe(true);
  expect(useMorrowStore.getState().projects[0].name).toBe("dự án Demo");
  expect(useMorrowStore.getState().tasks).toHaveLength(3);
  fireEvent.click(screen.getByRole("button", { name: /^Cài đặt$/ }));
  fireEvent.click(screen.getByRole("button", { name: "Xem lại hướng dẫn" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
