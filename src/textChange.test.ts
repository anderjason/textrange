import { describe, expect, it } from "vitest";
import { normalizeChangeSet, validateChangeSet } from "./textChange.js";

describe("Change Set validation", () => {
  it("accepts ordered non-overlapping Text Changes in previous-text coordinates", () => {
    expect(() => validateChangeSet([
      { start: 1, end: 2, insert: "" },
      { start: 4, end: 4, insert: "x" }
    ], "abcdef")).not.toThrow();
  });

  it("rejects invalid, unsorted, and overlapping Text Changes", () => {
    expect(() => validateChangeSet([{ start: -1, end: 0, insert: "" }], "abc")).toThrow(RangeError);
    expect(() => validateChangeSet([{ start: 2, end: 3, insert: "" }, { start: 1, end: 1, insert: "x" }], "abc")).toThrow(/ordered/);
    expect(() => validateChangeSet([{ start: 1, end: 3, insert: "" }, { start: 2, end: 2, insert: "x" }], "abc")).toThrow(/ordered/);
  });

  it("derives a default single Text Change when callers omit a Change Set", () => {
    expect(normalizeChangeSet(undefined, "abc", "abXc")).toEqual([{ start: 2, end: 2, insert: "X" }]);
  });
});
