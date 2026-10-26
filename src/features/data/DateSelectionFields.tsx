import { dateKey } from "../../lib/date";
import type { TaskDateFilter } from "../../services/dataTransfer";
export interface DateSelection { mode: "all" | "day" | "range"; from: string; to: string; includeBacklog: boolean }
export const initialDates = (): DateSelection => ({ mode: "all", from: dateKey(new Date()), to: dateKey(new Date()), includeBacklog: false });
export const dateSelectionValid = (value: DateSelection) => value.mode === "all" || (!!value.from && (value.mode === "day" || (!!value.to && value.from <= value.to)));
export const taskDateFilter = (value: DateSelection): TaskDateFilter | undefined => value.mode === "all" ? undefined : { from: value.from, to: value.mode === "day" ? value.from : value.to, includeBacklog: value.includeBacklog };
export function DateSelectionFields({ value, onChange, label }: { value: DateSelection; onChange: (value: DateSelection) => void; label: string }) {
  return <fieldset className="transfer-dates"><legend>{label}</legend>
    <div className="transfer-segments">{([{ id: "all", name: "Tất cả" }, { id: "day", name: "Một ngày" }, { id: "range", name: "Khoảng ngày" }] as const).map(item => <button type="button" key={item.id} aria-pressed={value.mode === item.id} onClick={() => onChange({ ...value, mode: item.id })}>{item.name}</button>)}</div>
    {value.mode !== "all" && <><div className="transfer-date-inputs"><label>{value.mode === "day" ? "Ngày" : "Từ ngày"}<input type="date" value={value.from} onChange={event => onChange({ ...value, from: event.target.value })} /></label>{value.mode === "range" && <label>Đến ngày<input type="date" min={value.from} value={value.to} onChange={event => onChange({ ...value, to: event.target.value })} /></label>}</div><label className="transfer-checkbox"><input type="checkbox" checked={value.includeBacklog} onChange={event => onChange({ ...value, includeBacklog: event.target.checked })} />Kèm việc chưa xếp lịch (Backlog)</label><p className="transfer-note">Lọc theo ngày được xếp lịch, gồm cả hai ngày đầu và cuối.</p>{!dateSelectionValid(value) && <p className="danger" role="alert">Chọn ngày hợp lệ; ngày kết thúc không được trước ngày bắt đầu.</p>}</>}
  </fieldset>;
}
