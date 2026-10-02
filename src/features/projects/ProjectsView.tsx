import { CreateProjectDialog } from "./CreateProjectDialog";
import { TaskStatusSelect } from "../../components/TaskStatusSelect";
import { useEffect, useState } from "react";
import { addDays, format, startOfToday } from "date-fns";
import { Archive, ArchiveRestore, CalendarDays, CirclePlus, FolderKanban, Save, Trash2, X } from "lucide-react";
import { useMorrowStore } from "../../stores/useMorrowStore";
import type { Project, Task } from "../../types/models";

const palette = ["#7667dc", "#4f8bc9", "#65a77a", "#d5a645", "#e47457", "#c24f6f", "#4aa6a3"];

function ProjectCard({ project, onOpenBacklog }: { project: Project; onOpenBacklog: () => void }) {
  const { tasks, updateProject, deleteProject } = useMorrowStore();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [customColor, setCustomColor] = useState(project.color);
  const count = tasks.filter((task) => task.projectId === project.id && !task.deletedAt).length;
  const completedCount = tasks.filter(task => task.projectId === project.id && !task.deletedAt && task.completedAt).length;
  const backlogCount = tasks.filter((task) => task.projectId === project.id && task.scheduledDate === null && !task.deletedAt && !task.completedAt).length;
  const save = () => updateProject(project.id, { name: name.trim() || project.name, description });
  return (
    <article className="project-card" style={{ "--project-color": project.color } as React.CSSProperties}>
      <div className="project-card-top"><span className="project-avatar"><FolderKanban size={19} /></span><small>{count} công việc</small></div>
      <input className="project-name-input" value={name} onChange={(event) => setName(event.target.value)} onBlur={save} />
      <textarea value={description} onChange={(event) => setDescription(event.target.value)} onBlur={save} placeholder="Mô tả ngắn cho dự án" />
      <p className="procedure-hint">{completedCount}/{count} hoàn thành · {count ? Math.round(completedCount / count * 100) : 0}%</p><progress max={count || 1} value={completedCount} aria-label={`Tiến độ ${project.name}`} />
      <div className="project-color-row">
        <div className="color-palette">{palette.map((color) => <button className={project.color === color ? "selected" : ""} style={{ background: color }} key={color} onClick={() => { setCustomColor(color); updateProject(project.id, { color }); }} aria-label={`Chọn màu ${color}`} />)}</div>
        <label className="custom-color-control" title="Chọn màu tùy chỉnh">
          <input type="color" value={project.color} onChange={(event) => { setCustomColor(event.target.value); updateProject(project.id, { color: event.target.value }); }} />
          <input
            className="hex-color-input"
            value={customColor}
            maxLength={7}
            onChange={(event) => setCustomColor(event.target.value)}
            onBlur={() => /^#[0-9a-f]{6}$/i.test(customColor) ? updateProject(project.id, { color: customColor }) : setCustomColor(project.color)}
            onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
            aria-label="Mã màu HEX"
          />
        </label>
      </div>
      <footer><button className="text-button backlog-link" onClick={onOpenBacklog}><CalendarDays size={15} /> Backlog · {backlogCount}</button><button className="text-button" onClick={() => updateProject(project.id, { archived: !project.archived })}><Archive size={15} /> {project.archived ? "Bỏ lưu trữ" : "Lưu trữ"}</button><button className="text-button danger" onClick={() => deleteProject(project.id)}><Trash2 size={15} /> Xóa</button><button className="text-button" onClick={save}><Save size={15} /> Lưu</button></footer>
    </article>
  );
}

function BacklogTaskRow({ task, archived, onScheduled }: { task: Task; archived: boolean; onScheduled?: (task: Task) => void }) {
  const { priorities, updateTask, scheduleTask, deleteTask } = useMorrowStore();
  const [title, setTitle] = useState(task.title);
  useEffect(() => setTitle(task.title), [task.title]);
  const saveTitle = () => {
    const next = title.trim();
    if (!next) setTitle(task.title);
    else if (next !== task.title) updateTask(task.id, { title: next });
  };
  const today = format(startOfToday(), "yyyy-MM-dd");
  const tomorrow = format(addDays(startOfToday(), 1), "yyyy-MM-dd");
  const schedule = (date: string) => { scheduleTask(task.id, date); onScheduled?.(task); };
  return (
    <div className={`backlog-task ${task.completedAt ? "completed" : ""}`}>
      <div className="backlog-task-main">
        <input value={title} onChange={(event) => setTitle(event.target.value)} onBlur={saveTitle} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} aria-label="Tên task backlog" />
        <select value={task.priorityId} onChange={(event) => updateTask(task.id, { priorityId: event.target.value })} aria-label="Độ ưu tiên">
          {priorities.filter((item) => !item.deletedAt).sort((a, b) => a.weight - b.weight).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
        </select>
        <button className="backlog-delete" onClick={() => deleteTask(task.id)} title="Xóa công việc"><Trash2 size={14} /></button>
      </div>
      <div className="backlog-task-footer">
        <TaskStatusSelect task={task} />
        {!archived && <div className="backlog-schedule"><button onClick={() => schedule(today)}>Hôm nay</button><button onClick={() => schedule(tomorrow)}>Ngày mai</button><input className="backlog-date-input" type="date" min={today} defaultValue="" onChange={(event) => { if (event.target.value) schedule(event.target.value); }} aria-label="Chọn ngày cho công việc" title="Chọn ngày" /></div>}
      </div>
    </div>
  );
}

function BacklogPanel({ project, onClose }: { project: Project; onClose: () => void }) {
  const { tasks, addBacklogTask, unscheduleTask } = useMorrowStore();
  const [title, setTitle] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [lastScheduled, setLastScheduled] = useState<Task | null>(null);
  const [page, setPage] = useState(1);
  const projectTasks = tasks.filter((task) => task.projectId === project.id && task.scheduledDate === null && !task.deletedAt);
  const openTasks = projectTasks.filter((task) => !task.completedAt).sort((a, b) => a.sortOrder - b.sortOrder);
  const doneTasks = projectTasks.filter((task) => task.completedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(openTasks.length / pageSize));
  const pagedTasks = openTasks.slice((page - 1) * pageSize, page * pageSize);
  const add = () => { if (title.trim() && !project.archived) { addBacklogTask(project.id, title); setTitle(""); } };
  useEffect(() => {
    if (!lastScheduled) return;
    const timer = window.setTimeout(() => setLastScheduled(null), 5000);
    return () => window.clearTimeout(timer);
  }, [lastScheduled]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  return (
    <div className="backlog-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="backlog-panel" aria-label={`Backlog ${project.name}`}>
        <header><div><span className="project-dot" style={{ background: project.color }} /><div><small>BACKLOG</small><h2>{project.name}</h2></div></div><button className="icon-button quiet" onClick={onClose} aria-label="Đóng backlog"><X size={18} /></button></header>
        {project.archived && <div className="backlog-archived-note"><Archive size={15} /> Project đang lưu trữ — bạn có thể xem và sửa task, nhưng cần khôi phục project trước khi xếp lịch.</div>}
        {!project.archived && <div className="backlog-quick-add"><CirclePlus size={17} /><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} placeholder="Thêm việc chưa xác định ngày..." /><button onClick={add} disabled={!title.trim()}>Thêm</button></div>}
        <div className="backlog-summary"><span><strong>{openTasks.length}</strong> việc chưa xếp lịch</span><span>Ưu tiên task rồi chọn ngày khi đã sẵn sàng.</span></div>
        <div className="backlog-list">{pagedTasks.map((task) => <BacklogTaskRow task={task} archived={project.archived} onScheduled={setLastScheduled} key={task.id} />)}{!openTasks.length && <div className="backlog-empty"><CalendarDays size={24} /><strong>Backlog đang trống</strong><span>Thêm những việc sẽ làm sau, chưa cần quyết định ngày ngay.</span></div>}
          {openTasks.length > pageSize && <div className="backlog-pagination"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Trước</button><span>Trang {page}/{totalPages}</span><button disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Sau</button></div>}
          {doneTasks.length > 0 && <section className="backlog-done"><button onClick={() => setShowDone((value) => !value)}>Đã hoàn thành · {doneTasks.length}</button>{showDone && doneTasks.map((task) => <BacklogTaskRow task={task} archived={project.archived} onScheduled={setLastScheduled} key={task.id} />)}</section>}
        </div>
        {lastScheduled && <div className="backlog-toast"><span>Đã xếp lịch “{lastScheduled.title}”.</span><button onClick={() => { unscheduleTask(lastScheduled.id); setLastScheduled(null); }}>Hoàn tác</button></div>}
      </aside>
    </div>
  );
}

export function ProjectsView() {
  const { projects, addProject } = useMorrowStore();
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<"active" | "archived">("active");
  const [backlogProjectId, setBacklogProjectId] = useState<string | null>(null);
  const visibleProjects = projects
    .filter((item) => !item.deletedAt && (mode === "archived" ? item.archived : !item.archived))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const archivedCount = projects.filter((item) => !item.deletedAt && item.archived).length;
  return (
    <main className="large-view">
      <div className="view-title-row"><div><span className="eyebrow">Không gian làm việc</span><h1>{mode === "active" ? "Quản lý dự án" : "Dự án lưu trữ"}</h1></div>{mode === "active" && <button className="primary-button" onClick={() => setCreating(true)}><CirclePlus size={16} /> Tạo dự án</button>}</div>
      <div className="project-view-tabs" role="tablist" aria-label="Loại dự án">
        <button className={mode === "active" ? "active" : ""} onClick={() => setMode("active")} role="tab" aria-selected={mode === "active"}><FolderKanban size={15} /> Đang dùng</button>
        <button className={mode === "archived" ? "active" : ""} onClick={() => setMode("archived")} role="tab" aria-selected={mode === "archived"}><ArchiveRestore size={15} /> Lưu trữ <span>{archivedCount}</span></button>
      </div>
      {visibleProjects.length > 0 ? <div className="project-grid">{visibleProjects.map((project) => <ProjectCard project={project} onOpenBacklog={() => setBacklogProjectId(project.id)} key={project.id} />)}</div> : <div className="projects-empty"><ArchiveRestore size={25} /><strong>{mode === "archived" ? "Chưa có dự án lưu trữ" : "Chưa có dự án đang dùng"}</strong><span>{mode === "archived" ? "Các dự án được lưu trữ sẽ xuất hiện tại đây để bạn khôi phục hoặc chỉnh sửa." : "Tạo dự án đầu tiên để bắt đầu lên kế hoạch."}</span></div>}
      {creating && <CreateProjectDialog onClose={() => setCreating(false)} onCreate={(name, color) => { addProject(name, color); setCreating(false); }} />}
      {backlogProjectId && projects.find((project) => project.id === backlogProjectId && !project.deletedAt) && <BacklogPanel project={projects.find((project) => project.id === backlogProjectId)!} onClose={() => setBacklogProjectId(null)} />}
    </main>
  );
}
