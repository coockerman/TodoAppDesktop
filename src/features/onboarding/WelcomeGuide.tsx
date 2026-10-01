import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, CheckCheck, CornerDownLeft, FolderKanban, ListChecks, Plus, RotateCcw, X } from "lucide-react";

const steps = [
  { title: "Bắt đầu với một dự án", body: "Mỗi dự án là một nhóm công việc, ví dụ Game A hoặc Công việc. Mở tab Dự án, nhập tên rồi nhấn Tạo dự án.", hint: "Bạn tự tạo dữ liệu của mình. Morrow bắt đầu với danh sách trống." },
  { title: "Nhập việc liên tục bằng Enter", body: "Trong Lịch, chọn ngày rồi thêm dự án vào ngày đó. Nhập tên việc và nhấn Enter: việc được lưu, ô nhập sẵn sàng cho việc tiếp theo.", hint: "Việc chưa cần ngày cụ thể có thể để trong Backlog của dự án." },
  { title: "Tick xong, nhìn rõ tiến độ", body: "Tick trạng thái Hoàn thành khi làm xong. Cuối ngày, dùng nút Chuyển để đưa tất cả việc chưa xong sang ngày khác.", hint: "Các thao tác được tự lưu. Không cần bấm nút Lưu sau khi tick." },
  { title: "Một checklist, dùng lại nhiều lần", body: "Mở Quy trình để tạo các bước thường làm, như Ra game mới hoặc Update game. Tick từng bước; nhấn Reset khi bắt đầu lần tiếp theo.", hint: "Reset giữ nguyên các bước và có thể hoàn tác. Bạn cũng có thể dán list nhiều dòng." },
];

function Illustration({ step }: { step: number }) {
  return <div className="guide-illustration" role="img" aria-label={["Minh họa tạo dự án Game A", "Minh họa nhập việc rồi nhấn Enter", "Minh họa tick hoàn thành và chuyển việc chưa xong", "Minh họa checklist dùng lại với Reset"][step]}>
    <div className="guide-demo" aria-hidden="true">
      <div className="guide-demo-bar"><span /><span /><span /><small>{["Dự án", "Lịch · Hôm nay", "Tiến độ trong ngày", "Quy trình · Ra game mới"][step]}</small></div>
      {step === 0 && <><div className="guide-demo-entry"><span>Game A</span><b><Plus size={13} />Tạo dự án</b></div><div className="guide-demo-project"><FolderKanban size={23} /><div><strong>Game A</strong><small>0 công việc · Sẵn sàng bắt đầu</small></div><Check size={17} /></div></>}
      {step === 1 && <><div className="guide-demo-label"><i />Game A</div><div className="guide-demo-row"><CheckCheck size={15} /><span>Chuẩn bị bản build</span><small>Đã thêm</small></div><div className="guide-demo-entry"><span>Upload game<span className="guide-caret">|</span></span><b>Enter<CornerDownLeft size={12} /></b></div><div className="guide-demo-caption">Ô nhập luôn sẵn sàng cho việc tiếp theo</div></>}
      {step === 2 && <><div className="guide-demo-progress"><span>1/2 hoàn thành</span><i><b /></i></div><div className="guide-demo-row done"><span className="guide-demo-check"><Check size={12} /></span><span>Chuẩn bị bản build</span></div><div className="guide-demo-row"><span className="guide-demo-check empty" /><span>Upload game</span></div><div className="guide-demo-move"><span>1 việc chưa xong</span><b>Ngày mai<ArrowRight size={13} /></b></div></>}
      {step === 3 && <><div className="guide-demo-label"><ListChecks size={15} />Ra game mới<span className="guide-demo-reset"><RotateCcw size={12} />Reset</span></div>{["Kiểm tra bản build", "Upload game", "Kiểm tra link tải"].map((title, index) => <div className={`guide-demo-row ${index < 2 ? "done" : ""}`} key={title}><span className={`guide-demo-check ${index === 2 ? "empty" : ""}`}>{index < 2 && <Check size={12} />}</span><span>{title}</span></div>)}</>}
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
    <div className="guide-body">
    <Illustration step={step} />
    <div className="guide-content" aria-live="polite"><span className="eyebrow">Bước {step + 1} / {steps.length}</span><h2 id="guide-title">{steps[step].title}</h2><p id="guide-body">{steps[step].body}</p><div className="guide-hint">{steps[step].hint}</div></div>
    </div>
    <footer className="guide-footer"><button className="text-button" onClick={onClose}>Bỏ qua</button><div className="guide-dots" aria-label={`Bước ${step + 1} trên ${steps.length}`}>{steps.map((item, index) => <i className={index === step ? "active" : ""} key={item.title} />)}</div><div className="guide-nav"><button className="soft-button" disabled={step === 0} onClick={() => setStep(step - 1)}>Quay lại</button><button className="primary-button" onClick={() => step === steps.length - 1 ? onStart() : setStep(step + 1)}>{step === steps.length - 1 ? "Bắt đầu" : "Tiếp tục"}<ArrowRight size={15} /></button></div></footer>
  </div></div>;
}
