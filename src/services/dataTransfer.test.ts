import { describe, it, expect } from "vitest";
import { createSeedData } from "../data/seed";
import { mergeImport, mergeProcedures, selectExportData } from "./dataTransfer";
import { buildExportPayload, parseImport } from "./storage";
describe("data transfer", () => {
  it("exports only completed tasks with their project and definitions", () => {
    const data = createSeedData();
    const result = selectExportData(data, "completed", "");
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks.every(task => task.completedAt)).toBe(true);
    expect(parseImport(JSON.stringify(buildExportPayload(result))).tasks).toEqual(result.tasks);
  });
  it("keeps current data when merging duplicates and adds new records", () => {
    const current = createSeedData();
    const incoming = createSeedData();
    incoming.projects[0].name = "Changed";
    incoming.tasks.push({ ...incoming.tasks[0], id: "new-task" });
    const merged = mergeImport(current, incoming);
    expect(merged.projects[0].name).toBe(current.projects[0].name);
    expect(merged.tasks).toHaveLength(4);
  });
  it("preserves multiline and image settings in JSON", () => {
    const data = createSeedData();
    data.procedures = [{ id: "p", name: "Flow", allowImages: true, allowMultiline: true, steps: [{ id: "s", title: "First\nSecond", checked: false, images: ["data:image/png;base64,AAAA"] }], createdAt: "now", updatedAt: "now", deletedAt: null }];
    expect(parseImport(JSON.stringify(buildExportPayload(data))).procedures).toEqual(data.procedures);
  });
  it("rejects malformed tasks and missing relationships", () => {
    const payload = buildExportPayload(createSeedData());
    expect(() => parseImport(JSON.stringify({ ...payload, tasks: [{}] }))).toThrow();
    expect(() => parseImport(JSON.stringify({ ...payload, projects: [] }))).toThrow();
  });
});

it("exports and imports procedures without changing projects or settings", () => {
  const current = createSeedData();
  const incoming = createSeedData();
  incoming.procedures = [{ id: "flow", name: "Release", steps: [], createdAt: "now", updatedAt: "now", deletedAt: null }];
  const exported = selectExportData(incoming, "procedures", "");
  expect(exported.projects).toEqual([]);
  expect(exported.tasks).toEqual([]);
  const merged = mergeProcedures(current, parseImport(JSON.stringify(buildExportPayload(exported))));
  expect(merged.procedures).toEqual(incoming.procedures);
  expect(merged.projects).toBe(current.projects);
  expect(merged.settings).toBe(current.settings);
  expect(mergeProcedures(merged, incoming).procedures).toHaveLength(1);
});
