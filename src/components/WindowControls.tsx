import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Copy, Minus, Square, X } from "lucide-react";
import { closeWindow, inTauri, minimizeWindow } from "../services/desktop";

export function WindowControls({ mini = false }: { mini?: boolean }) {
  const [maximized, setMaximized] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!inTauri() || mini) return;
    const appWindow = getCurrentWindow();
    let disposed = false;
    let unlisten: (() => void) | undefined;
    const refresh = async () => {
      const value = await appWindow.isMaximized();
      if (!disposed) setMaximized(value);
    };
    void refresh().catch(console.error);
    void appWindow.onResized(() => { void refresh().catch(console.error); }).then(cleanup => {
      if (disposed) cleanup(); else unlisten = cleanup;
    }).catch(console.error);
    return () => { disposed = true; unlisten?.(); };
  }, [mini]);
  const toggle = async () => {
    if (!inTauri()) return;
    setBusy(true);
    try { const appWindow = getCurrentWindow(); await appWindow.toggleMaximize(); setMaximized(await appWindow.isMaximized()); }
    catch (error) { console.error("Không thể thay đổi kích thước cửa sổ.", error); }
    finally { setBusy(false); }
  };
  const label = maximized ? "Khôi phục cửa sổ" : "Phóng to cửa sổ";
  return <div className="window-controls">
    <button className="icon-button quiet" aria-label="Thu nhỏ cửa sổ" title="Thu nhỏ cửa sổ" onClick={() => void minimizeWindow()}><Minus size={16} /></button>
    {!mini && <button className="icon-button quiet" aria-label={label} title={label} disabled={busy} onClick={() => void toggle()}>{maximized ? <Copy size={14} /> : <Square size={14} />}</button>}
    <button className="icon-button quiet danger-hover" aria-label="Đóng ứng dụng" title="Đóng ứng dụng" onClick={() => void closeWindow()}><X size={16} /></button>
  </div>;
}
