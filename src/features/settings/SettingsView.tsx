import { useState } from "react";
import { ArrowUp, ArrowDown, ALargeSmall, ArchiveRestore, Database, Eraser, Laptop, Moon, Plus, RotateCcw, ShieldCheck, Sun, Trash2, } from "lucide-react";
import { applyAlwaysOnTop, applyAutostart } from "../../services/desktop";
import { useMorrowStore } from "../../stores/useMorrowStore";
import type { ThemeMode } from "../../types/models";

const palette = ["#7667dc", "#4f8bc9", "#65a77a", "#d5a645", "#e47457", "#c24f6f"];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return <button className={`toggle ${checked ? "on" : ""}`} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}><i /></button>;
}

export function SettingsView({ onShowGuide, onData }: { onShowGuide: () => void; onData: () => void }) {
  const store = useMorrowStore();
  const { settings, priorities, statuses, auditEvents, updateSettings, addPriority, updatePriority, deletePriority, addStatus, updateStatus, deleteStatus, clearAuditHistory, purgeDeletedData } = store;
  const [priorityName, setPriorityName] = useState("");
  const [statusName, setStatusName] = useState("");
  const [message, setMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<"history" | "purge" | "reset" | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");

  const notify = (value: string) => { setMessage(value); window.setTimeout(() => setMessage(""), 3000); };
  const setTheme = (theme: ThemeMode) => updateSettings({ theme });
  const deletedProjects = store.projects.filter((item) => item.deletedAt).length;
  const deletedTasks = store.tasks.filter((item) => item.deletedAt || store.projects.some((project) => project.id === item.projectId && project.deletedAt)).length;
  const openConfirmation = (action: "history" | "purge" | "reset") => {
    if (action === "history" && !auditEvents.length) return;
    if (action === "purge" && !deletedProjects && !deletedTasks) { notify("Không có dữ liệu đã xóa để dọn."); return; }
    setConfirmPassword("");
    setConfirmAction(action);
  };
  const closeConfirmation = () => { setConfirmAction(null); setConfirmPassword(""); };
  const confirmDeletion = () => {
    if (confirmPassword !== "123456" || !confirmAction) return;
    if (confirmAction === "history") {
      clearAuditHistory();
      notify("Đã xóa toàn bộ lịch sử sự kiện.");
    } else if (confirmAction === "reset") {
      void store.resetAccount().then(() => applyAutostart(false)).catch(() => notify("Không thể đặt lại dữ liệu hoặc tự khởi động."));
    } else {
      const result = purgeDeletedData();
      notify(`Đã dọn ${result.projects} dự án, ${result.tasks} công việc và ${result.events} sự kiện liên quan.`);
    }
    closeConfirmation();
  };

  return (
    <main className="large-view settings-view">
      <div className="view-title-row"><div><span className="eyebrow">Cá nhân hóa Morrow</span><h1>Cài đặt</h1></div>{message && <span className="settings-message">{message}</span>}</div>

      <div className="settings-layout">
        <section className="settings-card wide">
          <header><span className="settings-icon"><ShieldCheck size={18} /></span><div><h3>Làm quen với Morrow</h3><p>4 bước ngắn để tạo dự án, nhập việc và dùng checklist quy trình.</p></div></header>
          <button className="soft-button" onClick={onShowGuide}>Xem lại hướng dẫn</button>
        </section>
        <section className="settings-card">
          <header><span className="settings-icon"><Sun size={18} /></span><div><h3>Giao diện</h3><p>Chọn cách Morrow hòa vào không gian làm việc.</p></div></header>
          <div className="theme-options">
            {[{ id: "system", label: "Theo Windows", icon: Laptop }, { id: "light", label: "Sáng", icon: Sun }, { id: "dark", label: "Tối", icon: Moon }].map(({ id, label, icon: Icon }) => <button key={id} className={settings.theme === id ? "selected" : ""} onClick={() => setTheme(id as ThemeMode)}><Icon size={18} /><span>{label}</span></button>)}
          </div>
          <div className="font-scale-setting">
            <div className="font-scale-label">
              <span><ALargeSmall size={16} /><strong>Cỡ giao diện</strong></span>
              <div><b>{Math.round((settings.fontScale ?? 1) * 100)}%</b><button className="icon-button quiet" onClick={() => updateSettings({ fontScale: 1 })} title="Đặt lại 100%"><RotateCcw size={14} /></button></div>
            </div>
            <div className="font-scale-slider"><small>A</small><input type="range" min="0.85" max="1.3" step="0.05" value={settings.fontScale ?? 1} onChange={(event) => updateSettings({ fontScale: Number(event.target.value) })} aria-label="Cỡ giao diện" /><strong>A</strong></div>
            <div className="font-scale-marks"><span>Nhỏ</span><span>Mặc định</span><span>Lớn</span></div>
          </div>
        </section>

        <section className="settings-card">
          <header><span className="settings-icon"><Laptop size={18} /></span><div><h3>Hành vi desktop</h3><p>Kiểm soát cách ứng dụng hoạt động trên Windows.</p></div></header>
          <div className="setting-line"><div><strong>Luôn nổi trên màn hình</strong><span>Giữ Morrow phía trên các cửa sổ khác.</span></div><Toggle checked={settings.alwaysOnTop} onChange={(value) => { updateSettings({ alwaysOnTop: value }); void applyAlwaysOnTop(value); }} /></div>
          <div className="setting-line"><div><strong>Khởi động cùng Windows</strong><span>Mở Morrow tự động sau khi đăng nhập.</span></div><Toggle checked={settings.autostart} onChange={(value) => { updateSettings({ autostart: value }); void applyAutostart(value).catch(() => notify("Không thể thay đổi tự khởi động.")); }} /></div>
        </section>

        <section className="settings-card wide">
          <header><span className="settings-icon"><ShieldCheck size={18} /></span><div><h3>Trạng thái công việc</h3><p>Mỗi công việc chọn một trạng thái. Dùng mũi tên để đổi thứ tự.</p></div></header>
          <div className="definition-list">
            {statuses.filter((item) => !item.deletedAt).sort((a, b) => a.weight - b.weight).map((item, index, list) => <div className="definition-row" key={item.id}><input type="color" value={item.color} onChange={(event) => updateStatus(item.id, { color: event.target.value })} /><input value={item.name} onChange={(event) => updateStatus(item.id, { name: event.target.value })} /><div className="order-buttons"><button className="icon-button" disabled={index === 0} aria-label={`Đưa ${item.name} lên`} onClick={() => store.reorderDefinition("statuses", item.id, -1)}><ArrowUp size={14} /></button><button className="icon-button" disabled={index === list.length - 1} aria-label={`Đưa ${item.name} xuống`} onClick={() => store.reorderDefinition("statuses", item.id, 1)}><ArrowDown size={14} /></button></div><button disabled={item.isSystem} onClick={() => deleteStatus(item.id)} title={item.isSystem ? "Trạng thái hệ thống" : "Xóa"}><Trash2 size={16} /></button></div>)}
            <div className="definition-add"><input value={statusName} onChange={(event) => setStatusName(event.target.value)} placeholder="Tên trạng thái mới" /><button className="soft-button" onClick={() => { if (statusName.trim()) { addStatus(statusName, palette[statuses.length % palette.length]); setStatusName(""); } }}><Plus size={15} /> Thêm trạng thái</button></div>
          </div>
        </section>

        <section className="settings-card wide">
          <header><span className="settings-icon"><ArchiveRestore size={18} /></span><div><h3>Độ ưu tiên</h3><p>Tùy chỉnh nhãn, màu và dùng mũi tên để đổi thứ tự.</p></div></header>
          <div className="definition-list">
            {priorities.filter((item) => !item.deletedAt).sort((a, b) => a.weight - b.weight).map((item, index, list) => <div className="definition-row" key={item.id}><input type="color" value={item.color} onChange={(event) => updatePriority(item.id, { color: event.target.value })} /><input value={item.name} onChange={(event) => updatePriority(item.id, { name: event.target.value })} /><div className="order-buttons"><button className="icon-button" disabled={index === 0} aria-label={`Đưa ${item.name} lên`} onClick={() => store.reorderDefinition("priorities", item.id, -1)}><ArrowUp size={14} /></button><button className="icon-button" disabled={index === list.length - 1} aria-label={`Đưa ${item.name} xuống`} onClick={() => store.reorderDefinition("priorities", item.id, 1)}><ArrowDown size={14} /></button></div><button disabled={item.isDefault} onClick={() => deletePriority(item.id)} title={item.isDefault ? "Mức mặc định" : "Xóa"}><Trash2 size={16} /></button></div>)}
            <div className="definition-add"><input value={priorityName} onChange={(event) => setPriorityName(event.target.value)} placeholder="Tên độ ưu tiên mới" /><button className="soft-button" onClick={() => { if (priorityName.trim()) { addPriority(priorityName, palette[priorities.length % palette.length]); setPriorityName(""); } }}><Plus size={15} /> Thêm mức</button></div>
          </div>
        </section>

        <section className="settings-card wide data-card">
          <header><span className="settings-icon"><Database size={18} /></span><div><h3>Dữ liệu của bạn</h3><p>Lưu local, có cấu trúc audit để sẵn sàng phân tích bằng AI.</p></div></header>
          <div className="data-summary"><div><strong>{store.tasks.filter((item) => !item.deletedAt).length}</strong><span>công việc</span></div><div><strong>{store.projects.filter((item) => !item.deletedAt).length}</strong><span>dự án</span></div><div><strong>{auditEvents.length}</strong><span>sự kiện lịch sử</span></div></div>
          <div className="data-actions"><button className="primary-button" onClick={onData}>Xuất / Nhập JSON</button><button className="danger-button" onClick={() => openConfirmation("reset")}>Clear account</button><button className="soft-button" onClick={() => openConfirmation("purge")}><Eraser size={16} /> Dọn dữ liệu đã xóa</button><button className="text-button danger" onClick={() => openConfirmation("history")} disabled={!auditEvents.length}><Trash2 size={15} /> Xóa lịch sử</button></div>
        </section>
      </div>

      {confirmAction && (
        <div className="confirm-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeConfirmation(); }}>
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <span className="confirm-icon"><Trash2 size={20} /></span>
            <h2 id="confirm-title">{confirmAction === "history" ? "Xóa toàn bộ lịch sử?" : confirmAction === "reset" ? "Clear account và bắt đầu lại?" : "Dọn vĩnh viễn dữ liệu đã xóa?"}</h2>
            <p>{confirmAction === "history" ? "Thao tác này xóa lịch sử thay đổi nhưng giữ nguyên các dự án và công việc hiện tại." : confirmAction === "reset" ? "Xóa toàn bộ dự án, công việc, quy trình, lịch sử và cài đặt. App sẽ trở về trạng thái người dùng mới với dự án Demo." : "Thao tác này xóa vĩnh viễn dữ liệu đã xóa mềm và không thể khôi phục lại."}</p>
            <div className="confirm-loss">
              <strong>Bạn sẽ mất:</strong>
              {confirmAction === "history" ? <span>• {auditEvents.length} sự kiện lịch sử</span> : confirmAction === "reset" ? <><span>• {store.projects.length} dự án và {store.tasks.length} công việc</span><span>• {store.procedures.length} quy trình và {auditEvents.length} sự kiện</span><span>• Toàn bộ cài đặt cá nhân</span></> : <><span>• {deletedProjects} dự án đã xóa</span><span>• {deletedTasks} công việc đã xóa</span><span>• Các sự kiện lịch sử liên quan</span></>}
            </div>
            <label className="confirm-password">Nhập mật khẩu xác nhận <b>123456</b><input autoFocus type="text" inputMode="numeric" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") confirmDeletion(); }} placeholder="Nhập 123456" aria-label="Mật khẩu xác nhận xóa" /></label>
            <div className="confirm-actions"><button className="soft-button" onClick={closeConfirmation}>Hủy</button><button className="danger-button" disabled={confirmPassword !== "123456"} onClick={confirmDeletion}><Trash2 size={15} /> Xác nhận xóa</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
