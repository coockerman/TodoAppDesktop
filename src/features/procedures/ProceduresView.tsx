import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, ListChecks, MoreHorizontal, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useMorrowStore } from "../../stores/useMorrowStore";
import { createId } from "../../lib/id";
import type { Procedure, ProcedureStep } from "../../types/models";

function EditableText({ value, label, onSave, className, multiline = false }: { multiline?: boolean; value: string; label: string; onSave: (value: string) => void; className?: string }) {
  const [draft, setDraft] = useState(value);
  const [previous, setPrevious] = useState(value);
  if (previous !== value) { setPrevious(value); setDraft(value); }
  const Field = multiline ? "textarea" : "input";
  return <Field rows={multiline ? 3 : undefined} className={className} value={draft} aria-label={label} onChange={(event) => setDraft(event.target.value)} onBlur={() => {
    const next = draft.trim();
    if (!next) setDraft(value);
    else if (next !== value) onSave(next);
  }} onKeyDown={(event) => {
    if (!multiline && event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); event.currentTarget.blur(); }
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
  const stepInput = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
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
    const titles = selected.allowMultiline ? [text.trim()].filter(Boolean) : text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
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
  const [imageError, setImageError] = useState("");
  const attachImages = async (files: File[], stepId?: string) => {
    if (!selected?.allowImages || !files.length) return;
    const procedureId = selected.id;
    const draftTitle = stepTitle.trim();
    try {
      const images = await Promise.all(files.map(file => new Promise<string>((resolve, reject) => {
        if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) { reject(new Error("Ảnh cần là PNG, JPEG, GIF hoặc WebP và không quá 5 MB.")); return; }
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Không thể đọc ảnh.")); reader.readAsDataURL(file);
      })));
      const current = useMorrowStore.getState().procedures.find(item => item.id === procedureId && !item.deletedAt);
      if (!current?.allowImages || (stepId && !current.steps.some(step => step.id === stepId))) return;
      const steps = stepId ? current.steps.map(step => step.id === stepId ? { ...step, images: [...(step.images ?? []), ...images] } : step)
        : [...current.steps, { id: createId("step"), title: draftTitle || "Bước có ảnh", checked: false, images }];
      updateProcedure(procedureId, { steps }, "images_added");
      if (!stepId) setStepTitle("");
      setUndo(null); setImageError("");
    } catch (error) { setImageError(error instanceof Error ? error.message : "Không thể thêm ảnh."); }
  };
  const pasteImages = (event: React.ClipboardEvent, stepId?: string) => {
    if (!selected?.allowImages) return false;
    const filesFromItems = Array.from(event.clipboardData.items ?? []).filter(item => item.type.startsWith("image/")).map(item => item.getAsFile()).filter((file): file is File => !!file);
    const files = filesFromItems.length ? filesFromItems : Array.from(event.clipboardData.files ?? []).filter(file => file.type.startsWith("image/"));
    if (!files.length) return false;
    event.preventDefault();
    void attachImages(files, stepId);
    return true;
  };
  const AddField = selected?.allowMultiline ? "textarea" : "input";
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
        <div className="procedure-options"><label><input type="checkbox" checked={!!selected.allowMultiline} onChange={event => updateProcedure(selected.id, { allowMultiline: event.target.checked })} /> Cho phép viết nhiều dòng</label><label><input type="checkbox" checked={!!selected.allowImages} onChange={event => updateProcedure(selected.id, { allowImages: event.target.checked })} /> Cho phép dán ảnh vào bước</label></div>
        {imageError && <p role="alert">{imageError}</p>}
        <div className="procedure-progress-track"><i style={{ width: `${selected.steps.length ? done / selected.steps.length * 100 : 0}%` }} /></div>
        <div className="procedure-steps">{selected.steps.map((step, index) => <div className={`procedure-step ${step.checked ? "checked" : ""}`} key={step.id} onPaste={event => pasteImages(event, step.id)}>
          <input type="checkbox" checked={step.checked} aria-label={`Hoàn thành: ${step.title}`} onChange={() => changeSteps(selected.steps.map((item) => item.id === step.id ? { ...item, checked: !item.checked } : item), "step_toggled")} />
          <div className="procedure-step-content"><EditableText multiline={!!selected.allowMultiline} value={step.title} label={`Tên bước ${index + 1}`} onSave={(title) => changeSteps(selected.steps.map((item) => item.id === step.id ? { ...item, title } : item))} />{selected.allowImages && <div className="step-images" tabIndex={0} onClick={event => { if (!(event.target as HTMLElement).closest("button, input, label")) event.currentTarget.focus(); }} aria-label={`Dán ảnh vào bước ${index + 1}`}>{step.images?.map((image, imageIndex) => <figure key={imageIndex}><img src={image} alt={`Ảnh bước ${index + 1}`} /><button className="text-button danger" aria-label={`Xóa ảnh ${imageIndex + 1} bước ${index + 1}`} onClick={() => changeSteps(selected.steps.map(item => item.id === step.id ? { ...item, images: item.images?.filter((_, position) => position !== imageIndex) } : item))}>Xóa ảnh</button></figure>)}<div className="step-image-controls"><span>Nhấn vào vùng này rồi Ctrl+V để dán ảnh</span><label className="soft-button image-file-button">Chọn ảnh<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple aria-label={`Chọn ảnh cho bước ${index + 1}`} onChange={event => { void attachImages(Array.from(event.target.files ?? []), step.id); event.target.value = ""; }} /></label></div></div>}</div>
          <div className="procedure-step-actions"><button className="icon-button" disabled={!index} aria-label={`Đưa bước ${index + 1} lên`} onClick={() => move(index, -1)}><ArrowUp size={14} /></button><button className="icon-button" disabled={index === selected.steps.length - 1} aria-label={`Đưa bước ${index + 1} xuống`} onClick={() => move(index, 1)}><ArrowDown size={14} /></button><button className="icon-button danger" aria-label={`Xóa bước ${index + 1}`} onClick={() => {
            updateProcedure(selected.id, { steps: selected.steps.filter((item) => item.id !== step.id) }, "step_deleted"); setUndo({ before: selected, message: "Đã xóa bước." });
          }}><Trash2 size={14} /></button></div>
        </div>)}</div>
        {!selected.steps.length && <p className="procedure-hint">Thêm các bước theo thứ tự bạn thường thực hiện.</p>}
        <div className="procedure-add-step"><Plus size={17} /><AddField ref={stepInput} value={stepTitle} onChange={(event) => setStepTitle(event.target.value)} placeholder={selected.allowMultiline ? "Viết đoạn văn, Ctrl+Enter để thêm bước…" : "Nhập bước rồi Enter, hoặc dán list nhiều dòng…"} aria-label="Thêm bước quy trình" onKeyDown={(event) => { if (event.key === "Enter" && (!selected.allowMultiline || event.ctrlKey) && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); addSteps(stepTitle); } }} onPaste={(event) => {
          if (pasteImages(event)) return;
          const text = event.clipboardData.getData("text");
          if (!selected.allowMultiline && /[\r\n]/.test(text)) { event.preventDefault(); const input = event.currentTarget; addSteps(stepTitle.slice(0, input.selectionStart ?? stepTitle.length) + text + stepTitle.slice(input.selectionEnd ?? stepTitle.length)); }
        }} /><button className="soft-button" disabled={!stepTitle.trim()} onClick={() => addSteps(stepTitle)}>Thêm</button></div>
        {selected.allowImages && <label className="soft-button image-file-button">Thêm bước từ ảnh<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple aria-label="Thêm bước từ ảnh" onChange={event => { void attachImages(Array.from(event.target.files ?? [])); event.target.value = ""; }} /></label>}
        <p className="procedure-hint">Tự lưu khi tick hoặc chỉnh sửa · Reset giữ nguyên các bước.</p>
      </> : <div className="procedure-empty"><ListChecks size={36} /><h2>Mỗi lần làm, một checklist rõ ràng</h2><p>Tạo bộ quy trình bên trái để bắt đầu.</p></div>}
      {undo && <div className="procedure-undo" role="status"><span>{undo.message}</span><button className="text-button" onClick={() => {
        updateProcedure(undo.before.id, { name: undo.before.name, steps: undo.before.steps, deletedAt: undo.before.deletedAt }, "undo"); setSelectedId(undo.before.id); setUndo(null);
      }}>Hoàn tác</button><button className="text-button" aria-label="Đóng thông báo" onClick={() => setUndo(null)}>×</button></div>}
    </section>
  </main>;
}
