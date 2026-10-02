import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { useMorrowStore } from "../../stores/useMorrowStore";
import { exportData, importDataFromFile } from "../../services/storage";
import { mergeImport, selectExportData, type ExportMode } from "../../services/dataTransfer";
import type { AppData } from "../../types/models";
export function DataView() {
  const store = useMorrowStore();
  const [mode, setMode] = useState<ExportMode>("projects");
  const [projectId, setProjectId] = useState("");
  const [importMode, setImportMode] = useState("merge");
  const [pending, setPending] = useState<AppData | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const projects = store.projects.filter(item => !item.deletedAt);
  const selectedId = projectId || projects[0]?.id || "";
  const output = selectExportData(store, mode, selectedId);
  const read = async () => { setBusy(true); try { setPending(await importDataFromFile()); setMessage(""); } catch { setMessage("File JSON không đúng định dạng Morrow."); } finally { setBusy(false); } };
  return <main className="large-view"><div className="view-title-row"><div><span className="eyebrow">Quản lý dữ liệu</span><h1>Xuất / Nhập JSON</h1></div></div><div className="settings-layout">
    <section className="settings-card"><header><Download size={20} /><div><h3>Xuất dữ liệu</h3><p>Chọn phạm vi cần chia sẻ hoặc sao lưu.</p></div></header><label className="transfer-field">Chế độ xuất<select value={mode} onChange={event => setMode(event.target.value as ExportMode)}><option value="projects">Tất cả dự án hiện tại và công việc</option><option value="project">Công việc theo một dự án</option><option value="completed">Các công việc đã hoàn thành</option><option value="backup">Sao lưu toàn bộ app</option></select></label>{mode === "project" && <label className="transfer-field">Dự án<select value={selectedId} onChange={event => setProjectId(event.target.value)}>{projects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}<p>{output.projects.length} dự án · {output.tasks.length} công việc · {output.procedures.length} quy trình</p><button className="primary-button" disabled={busy || (mode === "project" && !selectedId)} onClick={async () => { setBusy(true); try { if(await exportData(output)) setMessage("Đã xuất JSON."); } catch { setMessage("Không thể lưu file JSON."); } finally { setBusy(false); } }}><Download size={16} />Xuất JSON</button></section>
    <section className="settings-card"><header><Upload size={20} /><div><h3>Nhập dữ liệu</h3><p>Xem số lượng trước khi áp dụng. Khi gộp, bản ghi trùng ID được giữ nguyên.</p></div></header><label className="transfer-field">Chế độ nhập<select value={importMode} onChange={event => setImportMode(event.target.value)}><option value="merge">Gộp vào dữ liệu hiện tại</option><option value="tasks">Gộp dự án và công việc</option><option value="replace">Thay thế toàn bộ app</option></select></label><button className="soft-button" disabled={busy} onClick={() => void read()}>Chọn file JSON</button>{pending && <div className="transfer-preview"><p>{pending.projects.length} dự án · {pending.tasks.length} công việc · {pending.procedures.length} quy trình</p>{importMode === "replace" && <p className="danger">Toàn bộ dữ liệu và cài đặt hiện tại sẽ bị thay thế.</p>}<button className="primary-button" onClick={() => { store.replaceData(importMode === "replace" ? pending : mergeImport(store, pending, importMode === "tasks")); setPending(null); setMessage("Đã nhập dữ liệu."); }}>Xác nhận nhập</button><button className="text-button" onClick={() => setPending(null)}>Hủy</button></div>}</section></div>{message && <p role="status">{message}</p>}</main>;
}
