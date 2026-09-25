import { useState } from "react";
import { ArchiveRestore, Database, Download, Laptop, Moon, Plus, ShieldCheck, Sun, Trash2, Upload } from "lucide-react";
import { applyAlwaysOnTop, applyAutostart } from "../../services/desktop";
import { exportData, importDataFromFile } from "../../services/storage";
import { useMorrowStore } from "../../stores/useMorrowStore";
import type { ThemeMode } from "../../types/models";

const palette = ["#7667dc", "#4f8bc9", "#65a77a", "#d5a645", "#e47457", "#c24f6f"];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return <button className={`toggle ${checked ? "on" : ""}`} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}><i /></button>;
}

export function SettingsView() {
  const store = useMorrowStore();
  const { settings, priorities, statuses, auditEvents, updateSettings, addPriority, updatePriority, deletePriority, addStatus, updateStatus, deleteStatus, replaceData } = store;
  const [priorityName, setPriorityName] = useState("");
  const [statusName, setStatusName] = useState("");
  const [message, setMessage] = useState("");

  const notify = (value: string) => { setMessage(value); window.setTimeout(() => setMessage(""), 3000); };
  const setTheme = (theme: ThemeMode) => updateSettings({ theme });
  const handleImport = async () => {
    try { const data = await importDataFromFile(); if (data) { replaceData(data); notify("Đã nhập dữ liệu thành công."); } } catch { notify("File không đúng định dạng Morrow."); }
  };

  return (
    <main className="large-view settings-view">
      <div className="view-title-row"><div><span className="eyebrow">Cá nhân hóa Morrow</span><h1>Cài đặt</h1></div>{message && <span className="settings-message">{message}</span>}</div>

      <div className="settings-layout">
        <section className="settings-card">
          <header><span className="settings-icon"><Sun size={18} /></span><div><h3>Giao diện</h3><p>Chọn cách Morrow hòa vào không gian làm việc.</p></div></header>
          <div className="theme-options">
            {[{ id: "system", label: "Theo Windows", icon: Laptop }, { id: "light", label: "Sáng", icon: Sun }, { id: "dark", label: "Tối", icon: Moon }].map(({ id, label, icon: Icon }) => <button key={id} className={settings.theme === id ? "selected" : ""} onClick={() => setTheme(id as ThemeMode)}><Icon size={18} /><span>{label}</span></button>)}
          </div>
        </section>

        <section className="settings-card">
          <header><span className="settings-icon"><Laptop size={18} /></span><div><h3>Hành vi desktop</h3><p>Kiểm soát cách ứng dụng hoạt động trên Windows.</p></div></header>
          <div className="setting-line"><div><strong>Luôn nổi trên màn hình</strong><span>Giữ Morrow phía trên các cửa sổ khác.</span></div><Toggle checked={settings.alwaysOnTop} onChange={(value) => { updateSettings({ alwaysOnTop: value }); void applyAlwaysOnTop(value); }} /></div>
          <div className="setting-line"><div><strong>Khởi động cùng Windows</strong><span>Mở Morrow tự động sau khi đăng nhập.</span></div><Toggle checked={settings.autostart} onChange={(value) => { updateSettings({ autostart: value }); void applyAutostart(value).catch(() => notify("Không thể thay đổi tự khởi động.")); }} /></div>
        </section>

        <section className="settings-card wide">
          <header><span className="settings-icon"><ShieldCheck size={18} /></span><div><h3>Cột trạng thái</h3><p>Mỗi trạng thái xuất hiện thành một ô tick; trọng số cao nằm phía sau.</p></div></header>
          <div className="definition-list">
            {statuses.filter((item) => !item.deletedAt).sort((a, b) => a.weight - b.weight).map((item) => <div className="definition-row" key={item.id}><input type="color" value={item.color} onChange={(event) => updateStatus(item.id, { color: event.target.value })} /><input value={item.name} onChange={(event) => updateStatus(item.id, { name: event.target.value })} /><label>Trọng số <input type="number" value={item.weight} onChange={(event) => updateStatus(item.id, { weight: Number(event.target.value) })} /></label><button disabled={item.isSystem} onClick={() => deleteStatus(item.id)} title={item.isSystem ? "Trạng thái hệ thống" : "Xóa"}><Trash2 size={16} /></button></div>)}
            <div className="definition-add"><input value={statusName} onChange={(event) => setStatusName(event.target.value)} placeholder="Tên trạng thái mới" /><button className="soft-button" onClick={() => { if (statusName.trim()) { addStatus(statusName, palette[statuses.length % palette.length]); setStatusName(""); } }}><Plus size={15} /> Thêm cột</button></div>
          </div>
        </section>

        <section className="settings-card wide">
          <header><span className="settings-icon"><ArchiveRestore size={18} /></span><div><h3>Độ ưu tiên</h3><p>Tùy chỉnh nhãn, màu và trọng số sắp xếp.</p></div></header>
          <div className="definition-list">
            {priorities.filter((item) => !item.deletedAt).sort((a, b) => a.weight - b.weight).map((item) => <div className="definition-row" key={item.id}><input type="color" value={item.color} onChange={(event) => updatePriority(item.id, { color: event.target.value })} /><input value={item.name} onChange={(event) => updatePriority(item.id, { name: event.target.value })} /><label>Trọng số <input type="number" value={item.weight} onChange={(event) => updatePriority(item.id, { weight: Number(event.target.value) })} /></label><button disabled={item.isDefault} onClick={() => deletePriority(item.id)} title={item.isDefault ? "Mức mặc định" : "Xóa"}><Trash2 size={16} /></button></div>)}
            <div className="definition-add"><input value={priorityName} onChange={(event) => setPriorityName(event.target.value)} placeholder="Tên độ ưu tiên mới" /><button className="soft-button" onClick={() => { if (priorityName.trim()) { addPriority(priorityName, palette[priorities.length % palette.length]); setPriorityName(""); } }}><Plus size={15} /> Thêm mức</button></div>
          </div>
        </section>

        <section className="settings-card wide data-card">
          <header><span className="settings-icon"><Database size={18} /></span><div><h3>Dữ liệu của bạn</h3><p>Lưu local, có cấu trúc audit để sẵn sàng phân tích bằng AI.</p></div></header>
          <div className="data-summary"><div><strong>{store.tasks.filter((item) => !item.deletedAt).length}</strong><span>công việc</span></div><div><strong>{store.projects.filter((item) => !item.deletedAt).length}</strong><span>dự án</span></div><div><strong>{auditEvents.length}</strong><span>sự kiện lịch sử</span></div></div>
          <div className="data-actions"><button className="primary-button" onClick={() => void exportData(store).then((ok) => ok && notify("Đã xuất bản sao JSON."))}><Download size={16} /> Xuất JSON</button><button className="soft-button" onClick={() => void handleImport()}><Upload size={16} /> Nhập dữ liệu</button></div>
        </section>
      </div>
    </main>
  );
}
