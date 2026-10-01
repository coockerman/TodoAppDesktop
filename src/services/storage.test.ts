import { describe, expect, it } from "vitest";
import { createSeedData } from "../data/seed";
import { buildExportPayload, parseImport, loadData } from "./storage";

describe("Morrow export", () => {
  it("adds stable metadata without dropping app data", () => {
    const data = createSeedData();
    const payload = buildExportPayload(data);
    expect(payload.schemaVersion).toBe(1);
    expect(payload.app).toBe("Morrow");
    expect(payload.tasks).toHaveLength(data.tasks.length);
    expect(payload.procedures).toEqual(data.procedures);
    expect(payload.timezone).toBeTruthy();
  });
});

 it("imports older backups with an empty procedure list", () => {
  const payload = buildExportPayload(createSeedData());
  const { procedures: _procedures, ...legacy } = payload;
  expect(parseImport(JSON.stringify(legacy)).procedures).toEqual([]);
 });
 it("round-trips procedure progress and rejects invalid steps", () => {
  const data = createSeedData();
  data.procedures = [{ id: "p", name: "Update", steps: [{ id: "s", title: "Upload", checked: true }], createdAt: "now", updatedAt: "now", deletedAt: null }];
  const payload = buildExportPayload(data);
  expect(parseImport(JSON.stringify(payload)).procedures).toEqual(data.procedures);
  expect(() => parseImport(JSON.stringify({ ...payload, procedures: [{ ...data.procedures[0], steps: [{ title: "Bad" }] }] }))).toThrow();
 });

 it("starts empty with onboarding and working default definitions", async () => {
  const data = await loadData();
  expect(data.projects).toEqual([]);
  expect(data.tasks).toEqual([]);
  expect(data.procedures).toEqual([]);
  expect(data.settings.onboardingCompleted).toBe(false);
  expect(data.priorities.some((item) => item.isDefault)).toBe(true);
  expect(data.statuses.some((item) => item.isCompletionStatus)).toBe(true);
 });
 it("preserves cached user data and treats older installations as already onboarded", async () => {
  const data = createSeedData();
  const { onboardingCompleted: _completed, ...oldSettings } = data.settings;
  const projects = [{ id: "user-project", name: "Game thật" }];
  localStorage.setItem("morrow-app-data-v1", JSON.stringify({ ...data, projects, settings: oldSettings }));
  const loaded = await loadData();
  expect(loaded.projects).toEqual(projects);
  expect(loaded.settings.onboardingCompleted).toBe(true);
 });
