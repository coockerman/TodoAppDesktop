import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

export const inTauri = () => "__TAURI_INTERNALS__" in window;

export async function applyAlwaysOnTop(enabled: boolean) {
  if (inTauri()) await getCurrentWindow().setAlwaysOnTop(enabled);
}

let expandedSize: LogicalSize | null = null;
let restoreMaximized = false;
export async function applyMiniMode(enabled: boolean) {
  if (!inTauri()) return;
  const appWindow = getCurrentWindow();
  if (enabled) {
    restoreMaximized = await appWindow.isMaximized();
    if (restoreMaximized) await appWindow.unmaximize();
  }
  const size = (await appWindow.innerSize()).toLogical(await appWindow.scaleFactor());
  if (enabled && size.height > 68) expandedSize = new LogicalSize(size.width, size.height);
  await appWindow.setResizable(!enabled);
  const restored = expandedSize ?? size;
  await appWindow.setSize(new LogicalSize(enabled ? 560 : Math.min(restored.width, window.screen.availWidth), enabled ? 68 : Math.min(restored.height > 68 ? restored.height : 640, window.screen.availHeight - 48)));
  if (!enabled && restoreMaximized) { restoreMaximized = false; await appWindow.maximize(); }
}

export async function applyAutostart(enabled: boolean) {
  if (!inTauri()) return;
  await invoke("set_windows_autostart", { enabled });
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
