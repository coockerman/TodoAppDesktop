import { useEffect, useState } from "react";
import { ArrowRight, CalendarPlus, CalendarX, Check, ChevronDown, CirclePlus, FolderPlus, ListTodo, MoreHorizontal, Settings, Trash2, X } from "lucide-react";
import { formatFullDate, parseDateKey } from "../../lib/date";
import { useMorrowStore } from "../../stores/useMorrowStore";
import type { Project, Task } from "../../types/models";
import { EmptyState } from "../../components/EmptyState";

function QuickAdd({ project }: { project: Project }) {
  const [title, setTitle] = useState("");
  const addTask = useMorrowStore((state) => state.addTask);
  const submit = () => {
    if (!title.trim()) return;
    addTask(project.id, title);
    setTitle("");
  };
  return (
    <div className="quick-add">
      <CirclePlus size={16} style={{ color: project.color }} />
      <input value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submit()} placeholder="Thêm nhanh công việc..." aria-label={`Thêm việc vào ${project.name}`} />
      {title && <button onClick={submit}>Thêm</button>}
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const { priorities, statuses, toggleStatus, updateTask, unscheduleTask, deleteTask } = useMorrowStore();
  const [title, setTitle] = useState(task.title);
  const activeStatuses = statuses.filter((item) => !item.deletedAt).sort((a, b) => a.weight - b.weight);
  const priority = priorities.find((item) => item.id === task.priorityId);
  useEffect(() => setTitle(task.title), [task.title]);
  const saveTitle = () => {
    const nextTitle = title.trim();
    if (!nextTitle) { setTitle(task.title); return; }
    if (nextTitle !== task.title) updateTask(task.id, { title: nextTitle });
  };
  return (
    <div className={`task-row ${task.completedAt ? "completed" : ""}`}>
      <div className="task-name-wrap">
        <span className="task-grip"><MoreHorizontal size={15} /></span>
        <input className="task-title-input" value={title} onChange={(event) => setTitle(event.target.value)} onBlur={saveTitle} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} aria-label="Tên công việc" />
      </div>
      <select className="priority-select" value={task.priorityId} onChange={(event) => updateTask(task.id, { priorityId: event.target.value })} style={{ color: priority?.color }} aria-label="Độ ưu tiên">
        {priorities.filter((item) => !item.deletedAt).sort((a, b) => a.weight - b.weight).map((item) => <option value={item.id} key={item.id} style={{ color: item.color, backgroundColor: "var(--surface)" }}>{item.name}</option>)}
      </select>
      <div className="status-cells">
        {activeStatuses.map((status) => {
          const checked = task.statuses.find((item) => item.statusId === status.id)?.checked ?? false;
          return <button key={status.id} className={`status-check ${checked ? "checked" : ""}`} title={status.name} onClick={() => toggleStatus(task.id, status.id)} style={{ "--status-color": status.color } as React.CSSProperties}>{checked && <Check size={14} />}</button>;
        })}
      </div>
      <div className="task-actions"><button className="unschedule-task" onClick={() => unscheduleTask(task.id)} title="Đưa về Backlog"><CalendarX size={14} /></button><button className="delete-task" onClick={() => deleteTask(task.id)} title="Xóa công việc"><Trash2 size={15} /></button></div>
    </div>
  );
}

export function TaskPanel({ onManageProjects }: { onManageProjects: () => void }) {
  const { selectedDate, projects, tasks, statuses, bulkMoveOpenTasks, scheduleTask } = useMorrowStore();
  const [targetDate, setTargetDate] = useState("");
  const [notice, setNotice] = useState("");
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [backlogPickerOpen, setBacklogPickerOpen] = useState(false);
  const [backlogPage, setBacklogPage] = useState(1);
  const [revealedProjects, setRevealedProjects] = useState<Set<string>>(() => new Set());
  const activeProjects = projects.filter((item) => !item.deletedAt && !item.archived).sort((a, b) => a.sortOrder - b.sortOrder);
  const dayTasks = tasks.filter((item) => item.scheduledDate === selectedDate && !item.deletedAt);
  const openCount = dayTasks.filter((item) => !item.completedAt).length;
  const doneCount = dayTasks.length - openCount;
  const activeStatuses = statuses.filter((item) => !item.deletedAt).sort((a, b) => a.weight - b.weight);
  const projectsInDay = new Set(dayTasks.map((task) => task.projectId));
  const availableProjects = activeProjects.filter((project) => !projectsInDay.has(project.id) && !revealedProjects.has(project.id));
  const backlogTasks = tasks.filter((task) => task.scheduledDate === null && !task.deletedAt && !task.completedAt && activeProjects.some((project) => project.id === task.projectId));
  const backlogPageSize = 20;
  const backlogTotalPages = Math.max(1, Math.ceil(backlogTasks.length / backlogPageSize));
  const pagedBacklogTasks = backlogTasks.slice((backlogPage - 1) * backlogPageSize, backlogPage * backlogPageSize);

  useEffect(() => {
    setRevealedProjects(new Set());
    setProjectPickerOpen(false);
    setBacklogPickerOpen(false);
    setBacklogPage(1);
  }, [selectedDate]);
  useEffect(() => { if (backlogPage > backlogTotalPages) setBacklogPage(backlogTotalPages); }, [backlogPage, backlogTotalPages]);

  const revealProject = (projectId: string) => {
    setRevealedProjects((current) => new Set([...current, projectId]));
    setProjectPickerOpen(false);
  };

  const moveAll = () => {
    if (!targetDate) return;
    const count = bulkMoveOpenTasks(selectedDate, targetDate);
    setNotice(count ? `Đã chuyển ${count} công việc.` : "Không có công việc nào cần chuyển.");
    window.setTimeout(() => setNotice(""), 2600);
  };

  return (
    <section className="task-panel">
      <header className="task-panel-header">
        <div>
          <span className="eyebrow">Kế hoạch trong ngày</span>
          <h2>{formatFullDate(parseDateKey(selectedDate))}</h2>
        </div>
        <div className="day-progress">
          <strong>{doneCount}/{dayTasks.length || 0}</strong>
          <span>hoàn thành</span>
          <div><i style={{ width: `${dayTasks.length ? (doneCount / dayTasks.length) * 100 : 0}%` }} /></div>
        </div>
        <div className="day-task-actions">
          <div className="project-picker-wrap">
            <button className="soft-button backlog-picker-trigger" disabled={!backlogTasks.length} onClick={() => { setBacklogPickerOpen((open) => !open); setProjectPickerOpen(false); }}><CalendarPlus size={16} /> Từ Backlog <b>{backlogTasks.length}</b><ChevronDown size={14} /></button>
            {backlogPickerOpen && <div className="project-picker-menu backlog-picker-menu"><div className="backlog-picker-title"><span>Chọn việc cho ngày này</span><button onClick={() => setBacklogPickerOpen(false)} aria-label="Đóng"><X size={14} /></button></div>{activeProjects.map((project) => {
              const projectBacklog = pagedBacklogTasks.filter((task) => task.projectId === project.id).sort((a, b) => a.sortOrder - b.sortOrder);
              if (!projectBacklog.length) return null;
              return <section className="backlog-picker-group" key={project.id}><strong><i style={{ background: project.color }} />{project.name}<small>{projectBacklog.length}</small></strong>{projectBacklog.map((task) => <button key={task.id} onClick={() => scheduleTask(task.id, selectedDate)}><span>{task.title}</span><CalendarPlus size={14} /></button>)}</section>;
            })}{backlogTasks.length > backlogPageSize && <div className="backlog-pagination compact"><button disabled={backlogPage === 1} onClick={() => setBacklogPage((value) => value - 1)}>Trước</button><span>{backlogPage}/{backlogTotalPages}</span><button disabled={backlogPage === backlogTotalPages} onClick={() => setBacklogPage((value) => value + 1)}>Sau</button></div>}</div>}
          </div>
          <div className="project-picker-wrap">
            <button className="primary-button" onClick={() => { setProjectPickerOpen((open) => !open); setBacklogPickerOpen(false); }}><FolderPlus size={16} /> Thêm dự án <ChevronDown size={14} /></button>
            {projectPickerOpen && (
              <div className="project-picker-menu">
                <span className="project-picker-title">Thêm dự án vào ngày này</span>
                {availableProjects.map((project) => <button key={project.id} onClick={() => revealProject(project.id)}><span className="project-dot" style={{ background: project.color }} /><span>{project.name}</span><CirclePlus size={15} /></button>)}
                {!availableProjects.length && <p>Mọi dự án đang hoạt động đã có trong ngày.</p>}
                <button className="manage-projects-link" onClick={onManageProjects}><Settings size={14} /> Quản lý tất cả dự án</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {dayTasks.length === 0 && activeProjects.length === 0 && <EmptyState icon={ListTodo} title="Một ngày thật nhẹ" body="Tạo dự án đầu tiên rồi thêm công việc bạn muốn hoàn thành." />}

      <div className="project-task-list">
        {activeProjects.map((project) => {
          const projectTasks = dayTasks.filter((task) => task.projectId === project.id).sort((a, b) => a.sortOrder - b.sortOrder);
          if (!projectTasks.length && dayTasks.length > 0 && !revealedProjects.has(project.id)) return null;
          return (
            <article className="project-group" key={project.id}>
              <div className="project-heading">
                <div><span className="project-dot" style={{ background: project.color }} /><strong>{project.name}</strong><small>{projectTasks.length} việc</small></div>
                {projectTasks.length > 0 && <div className="status-labels">{activeStatuses.map((status) => <span key={status.id}>{status.name}</span>)}</div>}
              </div>
              {projectTasks.map((task) => <TaskRow task={task} key={task.id} />)}
              <QuickAdd project={project} />
            </article>
          );
        })}
      </div>

      {activeProjects.length > 0 && dayTasks.length === 0 && (
        <div className="empty-day">
          <EmptyState icon={ListTodo} title="Chưa có việc trong ngày này" body="Chọn một dự án bên dưới để nhập nhanh công việc đầu tiên." />
          <div className="empty-quick-grid">{activeProjects.map((project) => <QuickAdd project={project} key={project.id} />)}</div>
        </div>
      )}

      <footer className="bulk-move-bar">
        <div><strong>{openCount}</strong><span> việc chưa xong</span></div>
        <div className="move-controls">
          <span>Chuyển tất cả sang</span>
          <input type="date" value={targetDate} min={selectedDate} onChange={(event) => setTargetDate(event.target.value)} />
          <button className="soft-button" disabled={!targetDate || openCount === 0} onClick={moveAll}><ArrowRight size={16} /> Chuyển</button>
        </div>
        {notice && <span className="toast-inline">{notice}</span>}
      </footer>
    </section>
  );
}
