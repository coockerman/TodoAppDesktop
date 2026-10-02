import { useState } from "react";
import { Check, FolderKanban, Plus, X } from "lucide-react";
const colors = ["#7667dc", "#4f8bc9", "#65a77a", "#d5a645", "#e47457", "#c24f6f", "#4aa6a3"];
export function CreateProjectDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, color: string) => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(colors[0]);
  return <div className="confirm-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <form className="create-project-dialog" role="dialog" aria-modal="true" aria-labelledby="create-project-title" onSubmit={event => { event.preventDefault(); if (name.trim()) onCreate(name.trim(), color); }} onKeyDown={event => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input'));
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }}>
      <header className="create-project-header"><span className="create-project-icon"><FolderKanban size={23} /></span><button type="button" className="icon-button quiet" aria-label="Đóng tạo dự án" onClick={onClose}><X size={18} /></button></header>
      <h2 id="create-project-title">Một không gian cho ý tưởng mới</h2><p>Gom công việc của bạn vào một dự án để dễ theo dõi.</p>
      <label className="project-create-field">Tên dự án<input autoFocus value={name} maxLength={120} onChange={event => setName(event.target.value)} placeholder="Ví dụ: Ra mắt sản phẩm" required /></label>
      <fieldset className="project-create-colors"><legend>Màu nhận diện</legend><div>{colors.map(value => <button type="button" key={value} className={`project-color-swatch ${color === value ? "selected" : ""}`} style={{ background: value }} aria-label={`Màu ${value}`} aria-pressed={color === value} onClick={() => setColor(value)}>{color === value && <Check size={17} />}</button>)}<label className="project-custom-swatch" title="Chọn màu tùy chỉnh"><Plus size={18} /><input type="color" value={color} aria-label="Màu tùy chỉnh" onChange={event => setColor(event.target.value)} /></label></div></fieldset>
      <div className="project-create-preview"><span style={{ background: `${color}22`, color }}><FolderKanban size={20} /></span><div><strong>{name.trim() || "Dự án của bạn"}</strong><small>Sẵn sàng cho công việc đầu tiên</small></div><i style={{ background: color }} /></div>
      <footer><button type="button" className="soft-button" onClick={onClose}>Hủy</button><button className="primary-button" disabled={!name.trim()}><Plus size={16} />Tạo dự án</button></footer>
    </form>
  </div>;
}
