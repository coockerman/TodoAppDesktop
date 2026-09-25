import { Minus, X } from "lucide-react";
import { closeWindow, minimizeWindow } from "../services/desktop";

export function WindowControls() {
  return (
    <div className="window-controls">
      <button className="icon-button quiet" aria-label="Thu nhỏ cửa sổ" onClick={() => void minimizeWindow()}><Minus size={16} /></button>
      <button className="icon-button quiet danger-hover" aria-label="Đóng ứng dụng" onClick={() => void closeWindow()}><X size={16} /></button>
    </div>
  );
}
