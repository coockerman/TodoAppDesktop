import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, ListChecks, MoreHorizontal, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useMorrowStore } from "../../stores/useMorrowStore";
import { createId } from "../../lib/id";
import type { Procedure, ProcedureStep } from "../../types/models";

function EditableText({ value, label, onSave, className }: { value: string; label: string; onSave: (value: string) => void; className?: string }) {
  const [draft, setDraft] = useState(value);
  const [previous, setPrevious] = useState(value);
  if (previous !== value) { setPrevious(value); setDraft(value); }
  return <input className={className} value={draft} aria-label={label} onChange={(event) => setDraft(event.target.value)} onBlur={() => {
    const next = draft.trim();
    if (!next) setDraft(value);
    else if (next !== value) onSave(next);
  }} onKeyDown={(event) => {
    if (event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); event.currentTarget.blur(); }
    if (event.key === "Escape") { setDraft(value); }
  }} />;
}

export function ProceduresView() {
  const { procedures, addProcedure, updateProcedure } = useMorrowStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [stepTitle, setStepTitle] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [undo, setUndo] = useState<{ before: Procedure; message: string } | null>(null);
  const stepInput = useRef<HTMLInputElement>(null);
  const active = procedures.filter((item) => !item.deletedAt);
  const selected = active.find((item) => item.id === selectedId) ?? active[0];
  const done = selected?.steps.filter((step) => step.checked).length ?? 0;
  const create = () => {
    if (!name.trim()) return;
    setSelectedId(addProcedure(name)); setName(""); setStepTitle(""); setMenuOpen(false);
  };
  const changeSteps = (steps: ProcedureStep[], eventType = "steps_updated") => {
    if (!selected) return;
    setUndo(null); updateProcedure(selected.id, { steps }, eventType);
  };
  const addSteps = (text: string) => {
    if (!selected) return;
    const titles = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!titles.length) return;
    changeSteps([...selected.steps, ...titles.map((title) => ({ id: createId("step"), title, checked: false }))], "steps_added");
    setStepTitle(""); stepInput.current?.focus();
  };
  const remove = () => {
    if (!selected) return;
    updateProcedure(selected.id, { deletedAt: new Date().toISOString() }, "deleted");
    setUndo({ before: selected, message: `Đã xóa “${selected.name}”.` });
    setMenuOpen(false); setStepTitle("");
  };
  const reset = () => {
    if (!selected || !done) return;
    updateProcedure(selected.id, { steps: selected.steps.map((step) => ({ ...step, checked: false })) }, "reset");
    setUndo({ before: selected, message: "Đã bỏ tick tất cả các bước." });
  };
  const move = (index: number, offset: number) => {
    if (!selected) return;
    const steps = [...selected.steps];
    const [step] = steps.splice(index, 1); steps.splice(index + offset, 0, step);
    changeSteps(steps, "reordered");
  };
  return <main className="procedures-view">
    <aside className="procedure-sidebar">
      <header><ListChecks size={19} /><h2>Quy trình</h2></header>
      <form className="procedure-create" onSubmit={(event) => { event.preventDefault(); create(); }}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên bộ quy trình mới" aria-label="Tên bộ quy trình mới" onKeyDown={(event) => { if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault(); }} />
        <button className="icon-button" type="submit" disabled={!name.trim()} aria-label="Tạo bộ quy trình"><Plus size={18} /></button>
      </form>
      <div className="procedure-list">{active.map((item) => <button key={item.id} className={item.id === selected?.id ? "active" : ""} aria-current={item.id === selected?.id ? "true" : undefined} onClick={() => { setSelectedId(item.id); setStepTitle(""); setMenuOpen(false); }}><span>{item.name}</span><small>{item.steps.filter((step) => step.checked).length}/{item.steps.length}</small></button>)}</div>
      {!active.length && <p className="procedure-hint">Tạo bộ đầu tiên, ví dụ “Ra game mới” hoặc “Update game”.</p>}
    </aside>
    <section className="procedure-detail">
      {selected ? <>
        <header className="procedure-heading">
          <div><span className="eyebrow">Checklist dùng lại</span><EditableText value={selected.name} label="Tên bộ quy trình" className="procedure-name" onSave={(name) => { setUndo(null); updateProcedure(selected.id, { name }); }} /><span className="procedure-progress">{done}/{selected.steps.length} bước hoàn thành</span></div>
          <div className="procedure-actions"><button className="soft-button" disabled={!done} onClick={reset}><RotateCcw size={15} />Reset</button>
            <div className="procedure-menu-wrap"><button className="icon-button" aria-label="Thao tác quy trình" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={19} /></button>
              {menuOpen && <><button className="procedure-menu-dismiss" aria-label="Đóng menu quy trình" onClick={() => setMenuOpen(false)} /><div className="procedure-menu"><button onClick={() => { setSelectedId(addProcedure(`${selected.name} (bản sao)`, selected.id)); setStepTitle(""); setMenuOpen(false); }}><Copy size={15} />Nhân bản</button><button className="danger" onClick={remove}><Trash2 size={15} />Xóa bộ</button></div></>}
            </div>
          </div>
        </header>
        <div className="procedure-progress-track"><i style={{ width: `${selected.steps.length ? done / selected.steps.length * 100 : 0}%` }} /></div>
        <div className="procedure-steps">{selected.steps.map((step, index) => <div className={`procedure-step ${step.checked ? "checked" : ""}`} key={step.id}>
          <input type="checkbox" checked={step.checked} aria-label={`Hoàn thành: ${step.title}`} onChange={() => changeSteps(selected.steps.map((item) => item.id === step.id ? { ...item, checked: !item.checked } : item), "step_toggled")} />
          <EditableText value={step.title} label={`Tên bước ${index + 1}`} onSave={(title) => changeSteps(selected.steps.map((item) => item.id === step.id ? { ...item, title } : item))} />
          <div className="procedure-step-actions"><button className="icon-button" disabled={!index} aria-label={`Đưa bước ${index + 1} lên`} onClick={() => move(index, -1)}><ArrowUp size={14} /></button><button className="icon-button" disabled={index === selected.steps.length - 1} aria-label={`Đưa bước ${index + 1} xuống`} onClick={() => move(index, 1)}><ArrowDown size={14} /></button><button className="icon-button danger" aria-label={`Xóa bước ${index + 1}`} onClick={() => {
            updateProcedure(selected.id, { steps: selected.steps.filter((item) => item.id !== step.id) }, "step_deleted"); setUndo({ before: selected, message: "Đã xóa bước." });
          }}><Trash2 size={14} /></button></div>
        </div>)}</div>
        {!selected.steps.length && <p className="procedure-hint">Thêm các bước theo thứ tự bạn thường thực hiện.</p>}
        <div className="procedure-add-step"><Plus size={17} /><input ref={stepInput} value={stepTitle} onChange={(event) => setStepTitle(event.target.value)} placeholder="Nhập bước rồi Enter, hoặc dán list nhiều dòng…" aria-label="Thêm bước quy trình" onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); addSteps(stepTitle); } }} onPaste={(event) => {
          const text = event.clipboardData.getData("text");
          if (/[\r\n]/.test(text)) { event.preventDefault(); const input = event.currentTarget; addSteps(stepTitle.slice(0, input.selectionStart ?? stepTitle.length) + text + stepTitle.slice(input.selectionEnd ?? stepTitle.length)); }
        }} /><button className="soft-button" disabled={!stepTitle.trim()} onClick={() => addSteps(stepTitle)}>Thêm</button></div>
        <p className="procedure-hint">Tự lưu khi tick hoặc chỉnh sửa · Reset giữ nguyên các bước.</p>
      </> : <div className="procedure-empty"><ListChecks size={36} /><h2>Mỗi lần làm, một checklist rõ ràng</h2><p>Tạo bộ quy trình bên trái để bắt đầu.</p></div>}
      {undo && <div className="procedure-undo" role="status"><span>{undo.message}</span><button className="text-button" onClick={() => {
        updateProcedure(undo.before.id, { name: undo.before.name, steps: undo.before.steps, deletedAt: undo.before.deletedAt }, "undo"); setSelectedId(undo.before.id); setUndo(null);
      }}>Hoàn tác</button><button className="text-button" aria-label="Đóng thông báo" onClick={() => setUndo(null)}>×</button></div>}
    </section>
  </main>;
}
