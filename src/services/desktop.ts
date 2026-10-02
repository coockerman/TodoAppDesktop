import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";

export const inTauri = () => "__TAURI_INTERNALS__" in window;

export async function applyAlwaysOnTop(enabled: boolean) {
  if (inTauri()) await getCurrentWindow().setAlwaysOnTop(enabled);
}

let expandedSize: LogicalSize | null = null;
export async function applyMiniMode(enabled: boolean) {
  if (!inTauri()) return;
  const appWindow = getCurrentWindow();
  const size = (await appWindow.innerSize()).toLogical(await appWindow.scaleFactor());
  if (enabled && size.height > 68) expandedSize = new LogicalSize(size.width, size.height);
  await appWindow.setResizable(!enabled);
  const restored = expandedSize ?? size;
  await appWindow.setSize(new LogicalSize(enabled ? 560 : Math.min(restored.width, window.screen.availWidth), enabled ? 68 : Math.min(restored.height > 68 ? restored.height : 640, window.screen.availHeight - 48)));
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
