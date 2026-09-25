import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";

export const inTauri = () => "__TAURI_INTERNALS__" in window;

export async function applyAlwaysOnTop(enabled: boolean) {
  if (inTauri()) await getCurrentWindow().setAlwaysOnTop(enabled);
}

export async function applyMiniMode(enabled: boolean) {
  if (!inTauri()) return;
  const appWindow = getCurrentWindow();
  await appWindow.setResizable(!enabled);
  await appWindow.setSize(new LogicalSize(enabled ? 560 : 760, enabled ? 68 : 860));
}

export async function applyAutostart(enabled: boolean) {
  if (!inTauri()) return;
  const active = await isEnabled();
  if (enabled && !active) await enable();
  if (!enabled && active) await disable();
}

export async function minimizeWindow() {
  if (inTauri()) await getCurrentWindow().minimize();
}

export async function closeWindow() {
  if (inTauri()) await getCurrentWindow().close();
}

export async function startWindowDragging() {
  if (inTauri()) await getCurrentWindow().startDragging();
}
