import { describe, expect, it } from "vitest";
import { dateKey, formatFullDate, parseDateKey } from "./date";

describe("date helpers", () => {
  it("round-trips the local date key", () => {
    const parsed = parseDateKey("2026-09-25");
    expect(dateKey(parsed)).toBe("2026-09-25");
  });

  it("formats a Vietnamese day label", () => {
    expect(formatFullDate(parseDateKey("2026-09-25"))).toMatch(/25\/09/);
  });
});
