import { describe, expect, it } from "vitest";
import { createSeedData } from "../data/seed";
import { buildExportPayload } from "./storage";

describe("Morrow export", () => {
  it("adds stable metadata without dropping app data", () => {
    const data = createSeedData();
    const payload = buildExportPayload(data);
    expect(payload.schemaVersion).toBe(1);
    expect(payload.app).toBe("Morrow");
    expect(payload.tasks).toHaveLength(data.tasks.length);
    expect(payload.timezone).toBeTruthy();
  });
});
