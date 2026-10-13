import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WindowControls } from "./WindowControls";
const native = vi.hoisted(() => ({ maximized: false, toggleMaximize: vi.fn(), isMaximized: vi.fn(), onResized: vi.fn() }));
vi.mock("@tauri-apps/api/window", () => ({ getCurrentWindow: () => native }));
vi.mock("../services/desktop", () => ({ inTauri: () => true, closeWindow: vi.fn(), minimizeWindow: vi.fn() }));
beforeEach(() => { native.maximized = false; native.isMaximized.mockImplementation(async () => native.maximized); native.toggleMaximize.mockImplementation(async () => { native.maximized = !native.maximized; }); native.onResized.mockResolvedValue(vi.fn()); });
afterEach(cleanup);
it("uses the same button to maximize and restore the window", async () => {
  render(<WindowControls />);
  fireEvent.click(screen.getByRole("button", { name: "Phóng to cửa sổ" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Khôi phục cửa sổ" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Khôi phục cửa sổ" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Phóng to cửa sổ" })).toBeEnabled());
  expect(native.maximized).toBe(false);
});
it("keeps only minimize and close in mini mode", () => {
  render(<WindowControls mini />);
  expect(screen.getAllByRole("button")).toHaveLength(2);
});
