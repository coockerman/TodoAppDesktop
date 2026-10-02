import { useMorrowStore } from "../stores/useMorrowStore";
import { getTaskStatus } from "../lib/taskStatus";
import type { Task } from "../types/models";

export function TaskStatusSelect({ task }: { task: Task }) {
  const { statuses, setTaskStatus } = useMorrowStore();
  const items = statuses.filter(item => !item.deletedAt).sort((a, b) => a.weight - b.weight);
  const selected = getTaskStatus(task, items);
  return <select className="task-status-select" value={selected?.id ?? ""} disabled={!items.length} aria-label={`Trạng thái: ${task.title}`} style={{ color: selected?.color }} onChange={event => setTaskStatus(task.id, event.target.value)}>
    {items.map(item => <option key={item.id} value={item.id} style={{ color: item.color, backgroundColor: "var(--surface)" }}>{item.name}</option>)}
  </select>;
}
