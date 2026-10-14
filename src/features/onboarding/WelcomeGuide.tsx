import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, CheckCheck, CornerDownLeft, FolderKanban, ListChecks, Plus, RotateCcw, X } from "lucide-react";

const steps = [
  { tab: "Dự án", title: "Bắt đầu với một dự án", body: "Gom các việc cùng mục tiêu vào một dự án.", actions: ["Mở Dự án → Tạo dự án", "Đặt tên và chọn màu", "Thêm việc vào Backlog nếu chưa có ngày làm"], hint: "Dự án Demo có sẵn để bạn thử thao tác." },
  { tab: "Lịch", title: "Lên kế hoạch trong ngày", body: "Chọn ngày trước, thêm công việc sau.", actions: ["Chọn ngày trên lịch", "Thêm dự án hoặc chọn Từ Backlog", "Nhập việc → Enter để thêm liên tục"], hint: "Giữ dấu … để kéo việc. Giữ tiêu đề dự án để đổi thứ tự nhóm." },
  { tab: "Tiến độ", title: "Cập nhật việc đang làm", body: "Mỗi việc có độ ưu tiên và một trạng thái.", actions: ["Chọn Todo, đang làm hoặc Done", "Xem số việc hoàn thành ở đầu ngày", "Chọn ngày đích → Chuyển các việc chưa xong"], hint: "Morrow tự lưu sau mỗi thao tác. Đưa về Backlog bằng biểu tượng lịch có dấu ×." },
  { tab: "Quy trình", title: "Một checklist, dùng lại nhiều lần", body: "Tạo các bước cho công việc lặp lại.", actions: ["Tạo quy trình → thêm hoặc dán danh sách bước", "Bật ảnh hoặc nhiều dòng khi cần", "Tick từng bước → Reset để dùng lại"], hint: "Reset giữ các bước và có thể hoàn tác. Có thể nhân bản quy trình." },
  { tab: "Tổng quan", title: "Xem việc trên nhiều ngày", body: "Theo dõi tiến độ mà không cần mở từng ngày.", actions: ["Mở Tổng quan", "Lọc tuần, tháng hoặc Backlog", "Chọn dự án hoặc tìm theo tên việc"], hint: "Số liệu và tiến độ dự án thay đổi theo bộ lọc." },
  { tab: "Cài đặt & JSON", title: "Chọn cách làm việc của bạn", body: "Chỉnh giao diện và giữ bản sao dữ liệu.", actions: ["Cài đặt → chọn 1 cột hoặc 2 cột", "Xuất / Nhập JSON → chọn phạm vi", "Chọn Chỉ quy trình để chia sẻ checklist riêng"], hint: "Nhập gộp giữ bản ghi trùng ID. Sao lưu toàn bộ app để giữ cả cài đặt." },
];

function Illustration({ step }: { step: number }) {
  return <div className="guide-illustration" role="img" aria-label={["Minh họa tạo dự án Game A", "Minh họa nhập việc rồi nhấn Enter", "Minh họa tick hoàn thành và chuyển việc chưa xong", "Minh họa checklist dùng lại với Reset", "Minh họa bộ lọc tổng quan", "Minh họa bố cục và xuất nhập JSON"][step]}>
    <div className="guide-demo" aria-hidden="true">
      <div className="guide-demo-bar"><span /><span /><span /><small>{["Dự án", "Lịch · Hôm nay", "Tiến độ trong ngày", "Quy trình · Ra game mới", "Tổng quan", "Cài đặt · Dữ liệu"][step]}</small></div>
      {step === 0 && <><div className="guide-demo-entry"><span>Game A</span><b><Plus size={13} />Tạo dự án</b></div><div className="guide-demo-project"><FolderKanban size={23} /><div><strong>Game A</strong><small>0 công việc · Sẵn sàng bắt đầu</small></div><Check size={17} /></div></>}
      {step === 1 && <><div className="guide-demo-label"><i />Game A</div><div className="guide-demo-row"><CheckCheck size={15} /><span>Chuẩn bị bản build</span><small>Đã thêm</small></div><div className="guide-demo-entry"><span>Upload game<span className="guide-caret">|</span></span><b>Enter<CornerDownLeft size={12} /></b></div><div className="guide-demo-caption">Ô nhập luôn sẵn sàng cho việc tiếp theo</div></>}
      {step === 2 && <><div className="guide-demo-progress"><span>1/2 hoàn thành</span><i><b /></i></div><div className="guide-demo-row done"><span className="guide-demo-check"><Check size={12} /></span><span>Chuẩn bị bản build</span></div><div className="guide-demo-row"><span className="guide-demo-check empty" /><span>Upload game</span></div><div className="guide-demo-move"><span>1 việc chưa xong</span><b>Ngày mai<ArrowRight size={13} /></b></div></>}
      {step === 3 && <><div className="guide-demo-label"><ListChecks size={15} />Ra game mới<span className="guide-demo-reset"><RotateCcw size={12} />Reset</span></div>{["Kiểm tra bản build", "Upload game", "Kiểm tra link tải"].map((title, index) => <div className={`guide-demo-row ${index < 2 ? "done" : ""}`} key={title}><span className={`guide-demo-check ${index === 2 ? "empty" : ""}`}>{index < 2 && <Check size={12} />}</span><span>{title}</span></div>)}</>}
      {step === 4 && <><div className="guide-demo-entry"><span>Tuần này ▾</span><b>Mọi dự án ▾</b></div><div className="guide-demo-row"><span>3 công việc</span><small>1 hoàn thành · 2 còn lại</small></div><div className="guide-demo-progress"><span>Game A · 33%</span><i><b /></i></div><div className="guide-demo-row"><span>14/10</span><span>Chuẩn bị bản build</span><Check size={14} /></div></>}
      {step === 5 && <><div className="guide-demo-entry"><span>Bố cục trong ngày</span><b>1 cột / 2 cột</b></div><div className="guide-layout-demo"><span>Game A<br />… Công việc</span><span>Game B<br />… Công việc</span></div><div className="guide-demo-move"><span>Chỉ quy trình</span><b>Xuất JSON ↓</b></div></>}
    </div>
    <span className="guide-example-label">Ví dụ minh họa</span>
  </div>;
}

export function WelcomeGuide({ onClose, onStart }: { onClose: () => void; onStart: () => void }) {
  const [step, setStep] = useState(0);
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div className="guide-backdrop"><div ref={dialog} className="welcome-guide" role="dialog" aria-modal="true" aria-labelledby="guide-title" aria-describedby="guide-body" onKeyDown={(event) => {
    if (event.key === "Escape") { event.preventDefault(); onClose(); }
    if (event.key === "Tab") {
      const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
      if (!buttons?.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }}>
    <header className="guide-header"><span><span className="brand-mark small">M</span><strong>Làm quen với Morrow</strong></span><button ref={closeButton} className="icon-button" aria-label="Đóng hướng dẫn" onClick={onClose}><X size={18} /></button></header>
    <nav className="guide-topics" aria-label="Chủ đề hướng dẫn">{steps.map((item, index) => <button key={item.tab} aria-current={step === index ? "step" : undefined} onClick={() => setStep(index)}><small>{index + 1}</small>{item.tab}</button>)}</nav>
    <div className="guide-body">
    <Illustration step={step} />
    <div className="guide-content" aria-live="polite"><span className="eyebrow">Bước {step + 1} / {steps.length}</span><h2 id="guide-title">{steps[step].title}</h2><p id="guide-body">{steps[step].body}</p><ol className="guide-actions">{steps[step].actions.map(action => <li key={action}>{action}</li>)}</ol><div className="guide-hint">{steps[step].hint}</div></div>
    </div>
    <footer className="guide-footer"><button className="text-button" onClick={onClose}>Bỏ qua</button><div className="guide-dots" aria-label={`Bước ${step + 1} trên ${steps.length}`}>{steps.map((item, index) => <i className={index === step ? "active" : ""} key={item.title} />)}</div><div className="guide-nav"><button className="soft-button" disabled={step === 0} onClick={() => setStep(step - 1)}>Quay lại</button><button className="primary-button" onClick={() => step === steps.length - 1 ? onStart() : setStep(step + 1)}>{step === steps.length - 1 ? "Bắt đầu" : "Tiếp tục"}<ArrowRight size={15} /></button></div></footer>
  </div></div>;
}
