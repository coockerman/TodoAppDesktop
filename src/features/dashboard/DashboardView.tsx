import { useMemo, useState } from "react";
import { endOfMonth, endOfWeek, format, isBefore, parseISO, startOfMonth, startOfToday, startOfWeek } from "date-fns";
import { Search, SlidersHorizontal } from "lucide-react";
import { useMorrowStore } from "../../stores/useMorrowStore";
import type { Task } from "../../types/models";

type Range = "week" | "month" | "all";

export function DashboardView() {
  const { projects, tasks, priorities } = useMorrowStore();
  const [range, setRange] = useState<Range>("week");
  const [projectId, setProjectId] = useState("all");
  const [query, setQuery] = useState("");
  const today = startOfToday();

  const visible = useMemo(() => tasks.filter((task) => {
    if (task.deletedAt) return false;
    const date = parseISO(`${task.scheduledDate}T00:00:00`);
    const inRange = range === "all" || (range === "week"
      ? date >= startOfWeek(today, { weekStartsOn: 1 }) && date <= endOfWeek(today, { weekStartsOn: 1 })
      : date >= startOfMonth(today) && date <= endOfMonth(today));
    return inRange && (projectId === "all" || task.projectId === projectId) && task.title.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"));
  }).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)), [tasks, range, projectId, query]);

  const done = visible.filter((task) => task.completedAt).length;
  const overdue = visible.filter((task) => !task.completedAt && isBefore(parseISO(`${task.scheduledDate}T00:00:00`), today)).length;
  const groups = visible.reduce((result, task) => {
    const current = result.get(task.scheduledDate) ?? [];
    current.push(task);
    result.set(task.scheduledDate, current);
    return result;
  }, new Map<string, Task[]>());

  return (
    <main className="large-view dashboard-view">
      <div className="view-title-row">
        <div><span className="eyebrow">Bức tranh toàn cảnh</span><h1>Tổng quan công việc</h1></div>
        <div className="dashboard-filters">
          <select value={range} onChange={(event) => setRange(event.target.value as Range)}><option value="week">Tuần này</option><option value="month">Tháng này</option><option value="all">Tất cả</option></select>
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="all">Mọi dự án</option>{projects.filter((item) => !item.deletedAt).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
          <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm công việc" /></label>
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric-card violet"><span>Tổng công việc</span><strong>{visible.length}</strong><small>trong khoảng đã chọn</small></div>
        <div className="metric-card green"><span>Đã hoàn thành</span><strong>{done}</strong><small>{visible.length ? Math.round(done / visible.length * 100) : 0}% tiến độ</small></div>
        <div className="metric-card coral"><span>Đang quá hạn</span><strong>{overdue}</strong><small>cần được chú ý</small></div>
      </div>

      <section className="dashboard-list">
        <div className="section-title"><div><SlidersHorizontal size={17} /><strong>Danh sách theo ngày</strong></div><span>{visible.length} kết quả</span></div>
        {[...groups.entries()].map(([date, dayTasks]) => (
          <div className="dashboard-day" key={date}>
            <div className="dashboard-date"><strong>{format(parseISO(`${date}T00:00:00`), "dd")}</strong><span>{format(parseISO(`${date}T00:00:00`), "MM/yyyy")}</span></div>
            <div className="dashboard-day-tasks">
              {dayTasks.map((task) => {
                const project = projects.find((item) => item.id === task.projectId);
                const priority = priorities.find((item) => item.id === task.priorityId);
                return <div className={`dashboard-task ${task.completedAt ? "completed" : ""}`} key={task.id}><span className="project-dot" style={{ background: project?.color }} /><div><strong>{task.title}</strong><span>{project?.name}</span></div><span className="priority-pill" style={{ color: priority?.color, background: `${priority?.color}18` }}>{priority?.name}</span></div>;
              })}
            </div>
          </div>
        ))}
        {!visible.length && <div className="no-results">Không tìm thấy công việc phù hợp với bộ lọc.</div>}
      </section>
    </main>
  );
}
