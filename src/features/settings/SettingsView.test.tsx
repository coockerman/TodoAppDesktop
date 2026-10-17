import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SettingsView } from "./SettingsView";
import { useMorrowStore } from "../../stores/useMorrowStore";
import { createSeedData } from "../../data/seed";
import { applyAutostart } from "../../services/desktop";
vi.mock("../../services/desktop", () => ({ applyAutostart: vi.fn(), applyAlwaysOnTop: vi.fn() }));
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); useMorrowStore.setState({ ...createSeedData(), hydrated: true }); });
it("keeps the saved setting off when Windows rejects registration", async () => {
  vi.mocked(applyAutostart).mockRejectedValueOnce(new Error("Registry unavailable"));
  render(<SettingsView onData={() => {}} onShowGuide={() => {}} />);
  fireEvent.click(screen.getByRole("switch", { name: "Khởi động cùng Windows" }));
  await waitFor(() => expect(screen.getByText(/Registry unavailable/)).toBeInTheDocument());
  expect(useMorrowStore.getState().settings.autostart).toBe(false);
  expect(screen.getByRole("switch", { name: "Khởi động cùng Windows" })).toHaveAttribute("aria-checked", "false");
});
it("waits for Windows before saving and blocks repeated toggles while pending", async () => {
  let finish!: () => void;
  vi.mocked(applyAutostart).mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
  render(<SettingsView onData={() => {}} onShowGuide={() => {}} />);
  const toggle = screen.getByRole("switch", { name: "Khởi động cùng Windows" });
  fireEvent.click(toggle);
  expect(toggle).toBeDisabled();
  expect(useMorrowStore.getState().settings.autostart).toBe(false);
  finish();
  await waitFor(() => expect(toggle).toBeEnabled());
  expect(useMorrowStore.getState().settings.autostart).toBe(true);
});
