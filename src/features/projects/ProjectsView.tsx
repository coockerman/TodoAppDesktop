import { useState } from "react";
import { Archive, CirclePlus, FolderKanban, Save, Trash2 } from "lucide-react";
import { useMorrowStore } from "../../stores/useMorrowStore";
import type { Project } from "../../types/models";

const palette = ["#7667dc", "#4f8bc9", "#65a77a", "#d5a645", "#e47457", "#c24f6f", "#4aa6a3"];

function ProjectCard({ project }: { project: Project }) {
  const { tasks, updateProject, deleteProject } = useMorrowStore();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const count = tasks.filter((task) => task.projectId === project.id && !task.deletedAt).length;
  const save = () => updateProject(project.id, { name: name.trim() || project.name, description });
  return (
    <article className="project-card" style={{ "--project-color": project.color } as React.CSSProperties}>
      <div className="project-card-top"><span className="project-avatar"><FolderKanban size={19} /></span><small>{count} công việc</small></div>
      <input className="project-name-input" value={name} onChange={(event) => setName(event.target.value)} onBlur={save} />
      <textarea value={description} onChange={(event) => setDescription(event.target.value)} onBlur={save} placeholder="Mô tả ngắn cho dự án" />
      <div className="color-palette">{palette.map((color) => <button className={project.color === color ? "selected" : ""} style={{ background: color }} key={color} onClick={() => updateProject(project.id, { color })} aria-label={`Chọn màu ${color}`} />)}</div>
      <footer><button className="text-button" onClick={() => updateProject(project.id, { archived: !project.archived })}><Archive size={15} /> {project.archived ? "Bỏ lưu trữ" : "Lưu trữ"}</button><button className="text-button danger" onClick={() => deleteProject(project.id)}><Trash2 size={15} /> Xóa</button><button className="text-button" onClick={save}><Save size={15} /> Lưu</button></footer>
    </article>
  );
}

export function ProjectsView() {
  const { projects, addProject } = useMorrowStore();
  const [name, setName] = useState("");
  const create = () => { if (name.trim()) { addProject(name, palette[projects.length % palette.length]); setName(""); } };
  return (
    <main className="large-view">
      <div className="view-title-row"><div><span className="eyebrow">Không gian làm việc</span><h1>Quản lý dự án</h1></div><div className="new-project"><input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && create()} placeholder="Tên dự án mới" /><button className="primary-button" onClick={create}><CirclePlus size={16} /> Tạo dự án</button></div></div>
      <div className="project-grid">{projects.filter((item) => !item.deletedAt).sort((a, b) => Number(a.archived) - Number(b.archived)).map((project) => <ProjectCard project={project} key={project.id} />)}</div>
    </main>
  );
}
