import { useLayoutEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import type { AppView } from "../../types/models";
import { useDialogFocus } from "../../components/useDialogFocus";
const steps: { view: AppView; target: string; title: string; body: string }[] = [
  { view: "projects", target: '.view-title-row button', title: "Bắt đầu với một dự án", body: "Bấm Tạo dự án để gom các việc cùng mục tiêu. Dự án Demo có sẵn để bạn thử; Backlog giữ các việc chưa có ngày làm." },
  { view: "calendar", target: '.calendar-panel', title: "Chọn ngày làm việc", body: "Chọn một ngày trên lịch. Bạn có thể lập kế hoạch cho cả ngày cũ và ngày tương lai." },
  { view: "calendar", target: '.day-task-actions', title: "Thêm việc vào ngày", body: "Bấm Thêm dự án rồi chọn dự án để hiện ô nhập. Nhập tên việc và nhấn Enter để thêm liên tục, hoặc lấy việc từ Backlog." },
  { view: "calendar", target: '.bulk-move-bar', title: "Chuyển việc chưa xong", body: "Bấm Chuyển việc để xem danh sách theo ngày và dự án. Chọn ngày đích rồi bấm mũi tên cạnh từng việc. Việc Done được giữ nguyên ngày." },
  { view: "procedures", target: '.procedure-create', title: "Tạo quy trình dùng lại", body: "Đặt tên quy trình rồi thêm các bước. Bật nhiều dòng hoặc ảnh khi cần; tick khi làm xong và Reset để dùng lại." },
  { view: "dashboard", target: '.dashboard-filters', title: "Theo dõi tiến độ", body: "Lọc theo thời gian, dự án hoặc tìm tên việc để xem tiến độ trên nhiều ngày." },
  { view: "settings", target: '.theme-options', title: "Chọn giao diện của bạn", body: "Chọn bố cục, cỡ giao diện và ẩn độ ưu tiên. Bạn có thể mở lại hướng dẫn này trong Cài đặt, hoặc xuất bản sao ở Dữ liệu." },
];
export function WelcomeGuide({ onClose, onStart, onNavigate }: { onClose: () => void; onStart: () => void; onNavigate?: (view: AppView) => void }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const ref = useDialogFocus();
  useLayoutEffect(() => { onNavigate?.(steps[step].view); }, [step, onNavigate]);
  useLayoutEffect(() => {
    let frame = 0;
    const update = () => {
      const target = document.querySelector(steps[step].target) ?? document.querySelector(`.titlebar nav button[aria-label="${({ projects: "Dự án", calendar: "Lịch", procedures: "Quy trình", dashboard: "Tổng quan", settings: "Cài đặt", data: "Dữ liệu" })[steps[step].view]}"]`);
      const bounds = target?.getBoundingClientRect();
      const zoom = parseFloat(getComputedStyle(document.body).zoom) || 1;
      if (bounds) setRect({ top: bounds.top / zoom, left: bounds.left / zoom, width: bounds.width / zoom, height: bounds.height / zoom }); else setRect(null);
    };
    frame = requestAnimationFrame(update);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(document.documentElement);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [step]);
  const lower = rect && rect.top + rect.height / 2 < window.innerHeight / 2;
  return <div className={`tour-overlay ${rect ? "has-spotlight" : ""}`}>
    {rect && <div className="tour-spotlight" aria-hidden="true" style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }} />}
    <div ref={ref} className={`tour-card ${lower ? "tour-bottom" : "tour-top"}`} role="dialog" aria-modal="true" aria-labelledby="guide-title" aria-describedby="guide-body" onKeyDown={event => { if (event.key === "Escape") onClose(); }}>
      <header><span>Bước {step + 1} / {steps.length} · Hướng dẫn trực tiếp</span><button className="icon-button" aria-label="Đóng hướng dẫn" onClick={onClose}><X size={18} /></button></header>
      <h2 id="guide-title">{steps[step].title}</h2><p id="guide-body">{steps[step].body}</p>
      <footer><button className="text-button" onClick={onClose}>Bỏ qua</button><button className="soft-button" disabled={step === 0} onClick={() => setStep(step - 1)}>Quay lại</button><button className="primary-button" onClick={() => step === steps.length - 1 ? onStart() : setStep(step + 1)}>{step === steps.length - 1 ? "Bắt đầu" : "Tiếp tục"}<ArrowRight size={15} /></button></footer>
    </div>
  </div>;
}
