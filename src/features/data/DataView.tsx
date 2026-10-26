import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Check, FileJson, FolderKanban, ListChecks, ListTodo, ShieldCheck, X } from "lucide-react";
import { useMorrowStore } from "../../stores/useMorrowStore";
import { exportData, importDataFromFile } from "../../services/storage";
import { filterTaskDates, mergeImport, mergeProcedures, selectExportData, type ExportMode } from "../../services/dataTransfer";
import { DateSelectionFields, dateSelectionValid, initialDates, taskDateFilter } from "./DateSelectionFields";
import type { AppData } from "../../types/models";
function Summary({ data }: { data: AppData }) {
  return <div className="transfer-counts"><div><FolderKanban size={16} /><strong>{data.projects.length}</strong><span>dự án</span></div><div><ListTodo size={16} /><strong>{data.tasks.length}</strong><span>công việc</span></div><div><ListChecks size={16} /><strong>{data.procedures.length}</strong><span>quy trình</span></div></div>;
}
export function DataView() {
  const store = useMorrowStore();
  const [pane, setPane] = useState("export");
  const [mode, setMode] = useState<ExportMode>("projects");
  const [projectId, setProjectId] = useState("");
  const [exportDates, setExportDates] = useState(initialDates);
  const [importDates, setImportDates] = useState(initialDates);
  const [importMode, setImportMode] = useState("merge");
  const [pending, setPending] = useState<AppData | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const projects = store.projects.filter(item => !item.deletedAt);
  const selectedId = projectId || projects[0]?.id || "";
  const exportHasDates = mode !== "backup" && mode !== "procedures";
  const exportValid = !exportHasDates || dateSelectionValid(exportDates);
  const output = selectExportData(store, mode, selectedId, exportHasDates && exportValid ? taskDateFilter(exportDates) : undefined);
  const importHasDates = importMode === "merge" || importMode === "tasks";
  const importValid = !importHasDates || dateSelectionValid(importDates);
  let incoming = pending;
  if (incoming && importHasDates && importValid) {
    incoming = filterTaskDates(incoming, taskDateFilter(importDates));
    if (importDates.mode !== "all" || importMode === "tasks") incoming = { ...incoming, procedures: [] };
  }
  if (incoming && importMode === "procedures") incoming = { ...incoming, projects: [], tasks: [], procedures: incoming.procedures.filter(p => !p.deletedAt) };
  const duplicates = incoming?.tasks.filter(task => store.tasks.some(current => current.id === task.id)).length ?? 0;
  const read = async () => {
    setBusy(true);
    try { const data = await importDataFromFile(); if (data) { setPending(data); setConfirmed(false); setMessage(""); } }
    catch { setPending(null); setMessage("Không thể đọc file. Hãy chọn JSON được xuất từ Morrow và thử lại."); }
    finally { setBusy(false); }
  };
  const applyImport = () => {
    if (!incoming || !importValid || (importMode === "replace" && !confirmed)) return;
    // Read the latest store so an import never overwrites edits made after choosing the file.
    const current = useMorrowStore.getState();
    current.replaceData(importMode === "replace" ? incoming : importMode === "procedures" ? mergeProcedures(current, incoming) : mergeImport(current, incoming, importMode === "tasks"));
    setPending(null); setConfirmed(false); setMessage("Đã nhập dữ liệu thành công.");
  };
  return <main className="large-view transfer-view">
    <div className="view-title-row"><div><span className="eyebrow">Dữ liệu của bạn</span><h1>Xuất / Nhập JSON</h1><p className="transfer-subtitle">Sao lưu để yên tâm. Chọn đúng phần cần mang sang máy khác.</p></div><span className="transfer-local"><ShieldCheck size={15} />Lưu trên máy</span></div>
    {message && <div className="transfer-message" role="status"><FileJson size={17} /><span>{message}</span><button className="icon-button quiet" aria-label="Đóng thông báo dữ liệu" onClick={() => setMessage("")}><X size={16} /></button></div>}
    <nav className="transfer-mobile-tabs" aria-label="Thao tác dữ liệu"><button aria-pressed={pane === "export"} onClick={() => setPane("export")}><ArrowUpFromLine size={15} />Xuất dữ liệu</button><button aria-pressed={pane === "import"} onClick={() => setPane("import")}><ArrowDownToLine size={15} />Nhập dữ liệu</button></nav>
    <div className="transfer-grid">
      <section className={`transfer-card ${pane === "export" ? "active-pane" : ""}`} aria-labelledby="export-title"><header className="transfer-card-head"><span className="transfer-icon"><ArrowUpFromLine size={21} /></span><div><span className="eyebrow">Từ Morrow ra file</span><h2 id="export-title">Xuất dữ liệu</h2></div></header>
        <div className="transfer-card-body"><label className="transfer-field">Bạn muốn xuất gì?<select value={mode} onChange={event => setMode(event.target.value as ExportMode)}><option value="projects">Dự án và công việc</option><option value="project">Một dự án</option><option value="completed">Công việc đã hoàn thành</option><option value="procedures">Chỉ quy trình</option><option value="backup">Sao lưu toàn bộ app</option></select></label>
        {mode === "project" && <label className="transfer-field">Dự án<select value={selectedId} onChange={event => setProjectId(event.target.value)}>{projects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
        {exportHasDates ? <DateSelectionFields label="Ngày công việc cần xuất" value={exportDates} onChange={setExportDates} /> : <div className="transfer-info"><ShieldCheck size={17} /><p>{mode === "backup" ? "Bản sao đầy đủ gồm mọi ngày, Backlog, quy trình, lịch sử và cài đặt. Không áp dụng lọc ngày." : "Xuất tất cả quy trình đang dùng, gồm các bước và ảnh. Quy trình không phụ thuộc ngày."}</p></div>}
        <div className="transfer-preview-block"><span className="transfer-section-label">Nội dung file sẽ xuất</span>{exportValid ? <Summary data={output} /> : <p className="transfer-note">Hoàn tất khoảng ngày để xem số lượng.</p>}</div></div>
        <footer><span>Định dạng .json · Morrow</span><button className="primary-button" disabled={busy || !exportValid || (mode === "project" && !selectedId)} onClick={async () => { setBusy(true); try { if (await exportData(output)) setMessage("Đã xuất file JSON thành công."); } catch { setMessage("Không thể lưu file JSON. Hãy thử vị trí lưu khác."); } finally { setBusy(false); } }}><ArrowUpFromLine size={16} />Xuất JSON</button></footer>
      </section>
      <section className={`transfer-card ${pane === "import" ? "active-pane" : ""}`} aria-labelledby="import-title"><header className="transfer-card-head"><span className="transfer-icon import"><ArrowDownToLine size={21} /></span><div><span className="eyebrow">Từ file vào Morrow</span><h2 id="import-title">Nhập dữ liệu</h2></div></header>
        <div className="transfer-card-body"><button aria-label={pending ? "Chọn file JSON khác" : "Chọn file JSON"} className={`transfer-file ${pending ? "ready" : ""}`} disabled={busy} onClick={() => void read()}><FileJson size={29} /><strong>{busy ? "Đang xử lý…" : pending ? "File JSON đã sẵn sàng" : "Chọn file JSON"}</strong><span>{pending ? "Bấm để chọn file khác" : "Xem trước nội dung rồi mới xác nhận nhập"}</span>{pending && <Check size={16} />}</button>
        <label className="transfer-field">Cách nhập<select value={importMode} onChange={event => { setImportMode(event.target.value); setConfirmed(false); }}><option value="merge">Gộp vào dữ liệu hiện tại</option><option value="tasks">Chỉ gộp dự án và công việc</option><option value="procedures">Chỉ gộp quy trình</option><option value="replace">Khôi phục toàn bộ app</option></select></label>
        {importHasDates && <DateSelectionFields label="Ngày công việc cần nhập" value={importDates} onChange={setImportDates} />}
        {importMode !== "replace" && <p className="transfer-note">Gộp giữ nguyên dữ liệu đang có; bản ghi trùng ID được bỏ qua.{importHasDates && importDates.mode !== "all" ? " Khi lọc ngày, chỉ nhập dự án và công việc phù hợp." : ""}</p>}
        {pending && incoming && <div className="transfer-preview-block"><span className="transfer-section-label">Nội dung đã chọn từ file</span>{importValid ? <><Summary data={incoming} />{importMode !== "replace" && duplicates > 0 && <p className="transfer-note">{duplicates} công việc trùng ID sẽ được giữ nguyên, {incoming.tasks.length - duplicates} công việc mới sẽ được thêm.</p>}</> : <p className="transfer-note">Hoàn tất khoảng ngày để xem số lượng.</p>}
          {importMode === "replace" && <label className="transfer-replace"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /><span>Tôi hiểu toàn bộ dữ liệu và cài đặt hiện tại sẽ được thay bằng nội dung file, gồm mọi ngày.</span></label>}</div>}
        {!pending && <p className="transfer-note">File được kiểm tra định dạng và liên kết dữ liệu trước khi nhập.</p>}</div>
        <footer><span>{pending ? "Sẵn sàng xác nhận" : "Chưa chọn file"}</span><button className="primary-button" disabled={busy || !pending || !importValid || (importMode === "replace" && !confirmed)} onClick={applyImport}><ArrowDownToLine size={16} />{importMode === "replace" ? "Khôi phục dữ liệu" : "Xác nhận nhập"}</button></footer>
      </section>
    </div>
  </main>;
}
