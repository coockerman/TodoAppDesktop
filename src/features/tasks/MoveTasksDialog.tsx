import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { useDialogFocus } from "../../components/useDialogFocus";
import { useMorrowStore } from "../../stores/useMorrowStore";
import { formatFullDate, parseDateKey } from "../../lib/date";
export function MoveTasksDialog({ onClose }: { onClose: () => void }) {
  const { tasks, projects, selectedDate, scheduleTask } = useMorrowStore();
  const [target, setTarget] = useState(selectedDate);
  const [notice, setNotice] = useState("");
  const ref = useDialogFocus();
  const available = tasks.filter(task => !task.deletedAt && !task.completedAt && task.scheduledDate && task.scheduledDate !== target && projects.some(p => p.id === task.projectId && !p.deletedAt && !p.archived));
  const [scope, setScope] = useState("previous");
  const visible = available.filter(task => scope === "all" || task.scheduledDate! < target);
  const days = [...new Set(visible.map(task => task.scheduledDate!))].sort();
  return <div className="move-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={ref} className="move-dialog" role="dialog" aria-modal="true" aria-labelledby="move-title" onKeyDown={event => { if (event.key === "Escape") onClose(); }}>
      <header><h2 id="move-title">Chuyển việc chưa xong</h2><button className="icon-button" aria-label="Đóng chuyển việc" onClick={onClose}><X size={20} /></button></header>
      <div className="move-dialog-controls"><label>Ngày đích <input type="date" value={target} onChange={event => setTarget(event.target.value)} /></label><select aria-label="Phạm vi chuyển việc" value={scope} onChange={event => setScope(event.target.value)}><option value="previous">Trước ngày đích</option><option value="all">Tất cả ngày khác</option></select></div>
      <p className="move-help">Mũi tên chuyển từng việc sang ngày đã chọn. Chọn “Tất cả ngày khác” để chuyển việc về ngày cũ.</p>
      <div className="move-dialog-list">{days.map(day => <section key={day}><h3>{formatFullDate(parseDateKey(day))}</h3>{projects.filter(p => visible.some(t => t.projectId === p.id && t.scheduledDate === day)).map(p => <div key={p.id}><h4 style={{ color: p.color }}>{p.name}</h4>{visible.filter(t => t.projectId === p.id && t.scheduledDate === day).sort((a,b) => a.sortOrder-b.sortOrder).map(task => <div className="move-task" key={task.id}><span>{task.title}</span><button className="soft-button" disabled={!target} aria-label={`Chuyển ${task.title} sang ${target}`} onClick={() => { scheduleTask(task.id, target); setNotice(`Đã chuyển “${task.title}” sang ${target}.`); }}><ArrowRight size={18} /></button></div>)}</div>)}</section>)}{!visible.length && <p>Không có việc chưa xong trong phạm vi này.</p>}</div>
      <footer role="status">{notice || `${visible.length} việc có thể chuyển`}</footer>
    </div>
  </div>;
}
