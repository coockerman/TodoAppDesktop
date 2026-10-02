import type { StatusDefinition, Task } from "../types/models";
export function getTaskStatus(task: Task, definitions: StatusDefinition[]) {
  const active = definitions.filter(item => !item.deletedAt).sort((a, b) => a.weight - b.weight);
  const completion = active.find(item => item.isCompletionStatus);
  if (task.completedAt && completion) return completion;
  return active.find(item => task.statuses.some(value => value.statusId === item.id && value.checked))
    ?? active.find(item => !item.isCompletionStatus);
}
