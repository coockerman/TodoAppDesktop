import { useMemo, useState } from "react";
import { addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { dateKey, parseDateKey } from "../../lib/date";
import { useMorrowStore } from "../../stores/useMorrowStore";
import type { CalendarView } from "../../types/models";

const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function CalendarPanel() {
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const { selectedDate, selectDate, tasks, projects, settings, updateSettings } = useMorrowStore();
  const selected = parseDateKey(selectedDate);

  const days = useMemo(() => {
    if (view === "week") {
      return eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(cursor, { weekStartsOn: 1 }) });
    }
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
    });
  }, [cursor, view]);

  const move = (direction: -1 | 1) => setCursor((date) => view === "month" ? (direction === 1 ? addMonths(date, 1) : subMonths(date, 1)) : (direction === 1 ? addWeeks(date, 1) : subWeeks(date, 1)));
  const label = view === "month" ? format(cursor, "'Tháng' M, yyyy", { locale: vi }) : `Tuần ${format(days[0] ?? cursor, "dd/MM")} – ${format(days.at(-1) ?? cursor, "dd/MM")}`;

  if (settings.calendarCollapsed) {
    return (
      <div className="calendar-collapsed">
        <div>
          <span className="eyebrow">Ngày đang chọn</span>
          <strong>{format(selected, "EEEE, dd 'tháng' M", { locale: vi })}</strong>
        </div>
        <button className="soft-button" onClick={() => updateSettings({ calendarCollapsed: false })}><ChevronDown size={16} /> Hiện lịch</button>
      </div>
    );
  }

  return (
    <section className="calendar-panel">
      <div className="calendar-toolbar">
        <div className="segmented" aria-label="Kiểu lịch">
          <button className={view === "week" ? "active" : ""} onClick={() => setView("week")}>Tuần</button>
          <button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>Tháng</button>
        </div>
        <div className="calendar-navigation">
          <button className="icon-button" onClick={() => move(-1)} aria-label="Kỳ trước"><ChevronLeft size={18} /></button>
          <button className="month-label" onClick={() => setCursor(new Date())}>{label}</button>
          <button className="icon-button" onClick={() => move(1)} aria-label="Kỳ sau"><ChevronRight size={18} /></button>
        </div>
        <button className="soft-button compact" onClick={() => updateSettings({ calendarCollapsed: true })}><ChevronUp size={16} /> Ẩn lịch</button>
      </div>

      <div className={`calendar-grid ${view}`}>
        {weekdays.map((day) => <div className="weekday" key={day}>{day}</div>)}
        {days.map((day) => {
          const key = dateKey(day);
          const dayTasks = tasks.filter((task) => task.scheduledDate === key && !task.deletedAt);
          const colors = [...new Set(dayTasks.map((task) => projects.find((project) => project.id === task.projectId)?.color).filter(Boolean))].slice(0, 3);
          return (
            <button
              className={`calendar-day ${day.getDay() === 0 ? "sunday" : ""} ${isSameDay(day, selected) ? "selected" : ""} ${!isSameMonth(day, cursor) && view === "month" ? "outside" : ""}`}
              key={key}
              onClick={() => selectDate(key)}
            >
              <span>{format(day, "d")}</span>
              <span className="day-dots">
                {colors.map((color) => <i key={color} style={{ background: color }} />)}
              </span>
              {dayTasks.length > 0 && <small>{dayTasks.length}</small>}
            </button>
          );
        })}
      </div>
      <div className="calendar-hint"><CalendarDays size={14} /> Chấm màu thể hiện dự án có công việc trong ngày</div>
    </section>
  );
}
