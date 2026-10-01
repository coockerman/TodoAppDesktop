import { useEffect, useState } from "react";
import { BarChart3, CalendarDays, ListChecks, ChevronDown, ChevronUp, FolderKanban, LayoutDashboard, Settings } from "lucide-react";
import { WindowControls } from "../components/WindowControls";
import { CalendarPanel } from "../features/calendar/CalendarPanel";
import { DashboardView } from "../features/dashboard/DashboardView";
import { ProceduresView } from "../features/procedures/ProceduresView";
import { ProjectsView } from "../features/projects/ProjectsView";
import { SettingsView } from "../features/settings/SettingsView";
import { TaskPanel } from "../features/tasks/TaskPanel";
import { applyAlwaysOnTop, applyMiniMode, startWindowDragging } from "../services/desktop";
import { useMorrowStore } from "../stores/useMorrowStore";
import type { AppView } from "../types/models";

const nav = [
  { id: "calendar" as const, label: "Lịch", icon: CalendarDays },
  { id: "dashboard" as const, label: "Tổng quan", icon: LayoutDashboard },
  { id: "projects" as const, label: "Dự án", icon: FolderKanban },
  { id: "procedures" as const, label: "Quy trình", icon: ListChecks },
  { id: "settings" as const, label: "Cài đặt", icon: Settings },
];

function MiniBar() {
  const { tasks, selectedDate, settings, updateSettings } = useMorrowStore();
  const todayTasks = tasks.filter((task) => task.scheduledDate === selectedDate && !task.deletedAt);
  const done = todayTasks.filter((task) => task.completedAt).length;
  const percent = todayTasks.length ? Math.round(done / todayTasks.length * 100) : 0;
  const expand = () => updateSettings({ miniMode: false });
  const drag = (event: React.MouseEvent<HTMLElement>) => {
    if (event.button === 0 && !(event.target as HTMLElement).closest("button, input, select, textarea")) void startWindowDragging();
  };
  return (
    <div className="mini-bar" data-tauri-drag-region onMouseDown={drag}>
      <div className="brand-mark small">M</div>
      <strong>Morrow</strong>
      <span className="mini-divider" />
      <span>{done}/{todayTasks.length} hoàn thành</span>
      <div className="mini-progress"><i style={{ width: `${percent}%` }} /></div>
      <strong>{percent}%</strong>
      <button className="icon-button" onClick={expand} aria-label="Mở rộng"><ChevronDown size={17} /></button>
      <WindowControls />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<AppView>("calendar");
  const { hydrated, hydrate, settings, updateSettings } = useMorrowStore();

  useEffect(() => { void hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    const apply = () => root.dataset.theme = settings.theme === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : settings.theme;
    apply();
    const media = matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [hydrated, settings.theme]);
  useEffect(() => {
    const scale = settings.fontScale ?? 1;
    document.body.style.setProperty("zoom", String(scale));
    return () => {
      document.body.style.removeProperty("zoom");
    };
  }, [settings.fontScale]);
  useEffect(() => { if (hydrated) void applyAlwaysOnTop(settings.alwaysOnTop); }, [hydrated, settings.alwaysOnTop]);
  useEffect(() => { if (hydrated) void applyMiniMode(settings.miniMode); }, [hydrated, settings.miniMode]);

  if (!hydrated) return <div className="splash"><div className="brand-mark">M</div><strong>Morrow</strong><span>Đang chuẩn bị ngày mới...</span></div>;
  if (settings.miniMode) return <MiniBar />;

  const collapse = () => updateSettings({ miniMode: true });
  const drag = (event: React.MouseEvent<HTMLElement>) => {
    if (event.button === 0 && !(event.target as HTMLElement).closest("button, input, select, textarea")) void startWindowDragging();
  };

  return (
    <div className="app-shell">
      <header className="titlebar" data-tauri-drag-region onMouseDown={drag}>
        <button className="brand" onClick={() => setView("calendar")}><span className="brand-mark">M</span><span><strong>Morrow</strong><small>Make room for tomorrow</small></span></button>
        <nav>
          {nav.map(({ id, label, icon: Icon }) => {
            const isActive = view === id;
            return (
              <button
                key={id}
                className={isActive ? "active" : ""}
                onClick={() => setView(id)}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                title={label}
              >
                <Icon size={16} />
                {isActive && <span>{label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="title-actions">
          <button className="soft-button compact titlebar-collapse" onClick={collapse} aria-label="Thu gọn"><ChevronUp size={15} /><span>Thu gọn</span></button>
          <WindowControls />
        </div>
      </header>

      {view === "calendar" && <main className="calendar-view"><CalendarPanel /><TaskPanel onManageProjects={() => setView("projects")} /></main>}
      {view === "dashboard" && <DashboardView />}
      {view === "projects" && <ProjectsView />}
      {view === "procedures" && <ProceduresView />}
      {view === "settings" && <SettingsView />}

      <footer className="app-footer"><span><BarChart3 size={13} /> Morrow lưu dữ liệu an toàn trên máy của bạn</span><span>v0.1 · Local-first</span></footer>
    </div>
  );
}
