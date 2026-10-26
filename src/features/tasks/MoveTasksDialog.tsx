import { useState } from "react";
import { ArrowRight, CalendarDays, Check, CheckCheck, FolderKanban, Search, X } from "lucide-react";
import { useDialogFocus } from "../../components/useDialogFocus";
import { useMorrowStore } from "../../stores/useMorrowStore";
import { dateKey, formatFullDate, parseDateKey } from "../../lib/date";
export function MoveTasksDialog({ onClose }: { onClose: () => void }) {
  const { tasks, projects, selectedDate, scheduleTask } = useMorrowStore();
  const [target, setTarget] = useState(selectedDate);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scope, setScope] = useState("previous");
  const ref = useDialogFocus();
  const activeProjects = projects.filter(p => !p.deletedAt && !p.archived);
  const available = tasks.filter(task => !task.deletedAt && !task.completedAt && task.scheduledDate && task.scheduledDate !== target && activeProjects.some(p => p.id === task.projectId));
  const visible = available.filter(task => (scope === "all" || task.scheduledDate! < target) && (projectId === "all" || task.projectId === projectId) && task.title.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")));
  const days = [...new Set(visible.map(task => task.scheduledDate!))].sort();
  const checked = visible.filter(task => selected.has(task.id));
  const allChecked = !!visible.length && checked.length === visible.length;
  const targetLabel = target ? formatFullDate(parseDateKey(target)) : "Chọn ngày đích";
  const changeTarget = (date: string) => { setTarget(date); setSelected(new Set()); };
  const toggle = (id: string) => setSelected(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const move = (ids: string[]) => {
    if (!target) return;
    // Eligibility is checked again against current data by scheduleTask.
    for (const id of ids) scheduleTask(id, target);
    setSelected(current => new Set([...current].filter(id => !ids.includes(id))));
    setNotice(`Đã chuyển ${ids.length} việc sang ${targetLabel}.`);
  };
  return <div className="move-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={ref} className="move-dialog move-workspace" role="dialog" aria-modal="true" aria-labelledby="move-title" onKeyDown={event => { if (event.key === "Escape") onClose(); }}>
      <header><div><span className="eyebrow">Sắp xếp lại kế hoạch</span><h2 id="move-title">Chuyển việc chưa xong</h2><p>Gom việc còn dở sang một ngày phù hợp hơn.</p></div><button className="icon-button quiet" aria-label="Đóng chuyển việc" onClick={onClose}><X size={20} /></button></header>
      <div className="move-destination"><span className="move-calendar-icon"><CalendarDays size={22} /></span><div><span>Chuyển đến</span><strong>{targetLabel}</strong></div><label className="move-target-date">Ngày đích<input type="date" value={target} onChange={event => changeTarget(event.target.value)} /></label><button className="soft-button" onClick={() => changeTarget(dateKey(new Date()))}>Hôm nay</button></div>
      <div className="move-filters"><label className="move-search"><Search size={16} /><input aria-label="Tìm công việc cần chuyển" placeholder="Tìm công việc…" value={query} onChange={event => setQuery(event.target.value)} /></label><select aria-label="Lọc dự án chuyển việc" value={projectId} onChange={event => setProjectId(event.target.value)}><option value="all">Mọi dự án</option>{activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><select aria-label="Phạm vi chuyển việc" value={scope} onChange={event => setScope(event.target.value)}><option value="previous">Trước ngày đích</option><option value="all">Tất cả ngày khác</option></select></div>
      <div className="move-list-toolbar"><label><input type="checkbox" checked={allChecked} disabled={!visible.length} onChange={() => setSelected(allChecked ? new Set() : new Set(visible.map(task => task.id)))} />Chọn tất cả</label><span>{visible.length} việc · {days.length} ngày</span></div>
      <div className="move-dialog-list">{days.map(day => <section className="move-day-group" key={day}><h3><CalendarDays size={14} />{formatFullDate(parseDateKey(day))}<small>{visible.filter(t => t.scheduledDate === day).length} việc</small></h3>{activeProjects.filter(p => visible.some(t => t.projectId === p.id && t.scheduledDate === day)).map(p => <div className="move-project-group" key={p.id}><h4><FolderKanban size={13} style={{ color: p.color }} />{p.name}</h4>{visible.filter(t => t.projectId === p.id && t.scheduledDate === day).sort((a,b) => a.sortOrder-b.sortOrder).map(task => <div className={`move-task ${selected.has(task.id) ? "selected" : ""}`} key={task.id}><label><input type="checkbox" checked={selected.has(task.id)} onChange={() => toggle(task.id)} aria-label={`Chọn ${task.title}`} /><span>{task.title}</span></label><button className="move-row-action" disabled={!target} aria-label={`Chuyển ${task.title} sang ${target}`} title={`Chuyển sang ${targetLabel}`} onClick={() => move([task.id])}><span>Chuyển</span><ArrowRight size={16} /></button></div>)}</div>)}</section>)}{!visible.length && <div className="move-empty"><CheckCheck size={34} /><strong>{available.length ? "Không có việc khớp bộ lọc" : "Không còn việc cần chuyển"}</strong><p>{available.length ? "Thử tìm từ khóa khác hoặc chọn Tất cả ngày khác để chuyển về ngày cũ." : "Các việc Done và Backlog không nằm trong danh sách này."}</p></div>}</div>
      <footer><div className="move-footer-status" role="status">{notice ? <><Check size={15} /><span>{notice}</span></> : <span>Việc Done được giữ nguyên ngày. Backlog không được đưa vào đây.</span>}</div><button className="primary-button" disabled={!target || !checked.length} onClick={() => move(checked.map(task => task.id))}>Chuyển {checked.length || "việc đã chọn"}{checked.length ? " việc" : ""}<ArrowRight size={16} /></button></footer>
    </div>
  </div>;
}
