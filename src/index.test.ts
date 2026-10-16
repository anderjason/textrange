import { describe, expect, it } from "vitest";
import {
  createDomRangeAnchor,
  createRangeAnchor,
  diffTextChange,
  domRangeToOffsets,
  findDomRangeAnchor,
  findRangeAnchor,
  getDomText,
  offsetsToDomRange,
  refreshRangeAnchor,
  updateRangeAnchors
} from "./index.js";

function expectFound(result: ReturnType<typeof findRangeAnchor>) {
  expect(result.status).toBe("found");
  if (result.status !== "found") throw new Error("expected found");
  return result;
}

describe("text range anchors", () => {
  it("creates trimmed quote, context, and position without generated ids", () => {
    const anchor = createRangeAnchor("0123456789  hello world  abcdef", { start: 10, end: 25 }, { contextLength: 4 });
    expect(anchor).toEqual({
      quote: { exact: "hello world", prefix: "89  ", suffix: "  ab" },
      position: { start: 12, end: 23 }
    });
    expect("id" in anchor).toBe(false);
  });

  it("can preserve whitespace and use default 32 character context", () => {
    const text = `${"p".repeat(40)}  exact  ${"s".repeat(40)}`;
    const anchor = createRangeAnchor(text, { start: 40, end: 49 }, { trim: false });
    expect(anchor.quote.exact).toBe("  exact  ");
    expect(anchor.quote.prefix).toHaveLength(32);
    expect(anchor.quote.suffix).toHaveLength(32);
  });

  it("finds by position when still valid", () => {
    const anchor = createRangeAnchor("alpha beta gamma", { start: 6, end: 10 });
    const result = expectFound(findRangeAnchor("alpha beta gamma", anchor));
    expect(result.range).toEqual({ start: 6, end: 10 });
    expect(result.matchPath).toBe("position");
    expect(result.confidence).toBe(1);
  });

  it("falls back to literal quote and context when position is stale", () => {
    const anchor = createRangeAnchor("one repeated two repeated three", { start: 17, end: 25 }, { contextLength: 5 });
    const result = expectFound(findRangeAnchor("insert one repeated two repeated three", anchor));
    expect(result.range).toEqual({ start: 24, end: 32 });
    expect(result.matchPath).toBe("quote-context");
  });

  it("reports missing and ambiguous quote matches as structured not-found results", () => {
    const missing = findRangeAnchor("alpha beta", createRangeAnchor("alpha gamma", { start: 6, end: 11 }));
    expect(missing).toMatchObject({ status: "not-found", reason: "quote-not-found" });

    const ambiguous = findRangeAnchor("x same y same z", { quote: { exact: "same" } });
    expect(ambiguous.status).toBe("not-found");
    if (ambiguous.status === "not-found") {
      expect(ambiguous.reason).toBe("ambiguous");
      expect(ambiguous.candidates).toHaveLength(2);
    }
  });

  it("rounds candidate confidence scores", () => {
    const result = findRangeAnchor("bctargetxtargetde", { quote: { exact: "target", prefix: "abc", suffix: "def" } });
    expect(result.status).toBe("not-found");
    if (result.status !== "not-found") throw new Error("expected not found");
    expect(result.candidates).toEqual([
      { range: { start: 2, end: 8 }, confidence: 0.56, prefixScore: 0.67, suffixScore: 0 },
      { range: { start: 9, end: 15 }, confidence: 0.56, prefixScore: 0, suffixScore: 0.67 }
    ]);
  });

  it("chooses a repeated quote when one candidate has a perfect context side and clear margin", () => {
    const anchor = createRangeAnchor("the note mentions payment details for invoices", { start: 18, end: 33 }, { contextLength: 11 });
    const result = expectFound(findRangeAnchor("payment details, payment details for invoices", anchor));
    expect(result.range).toEqual({ start: 17, end: 32 });
    expect(result.matchPath).toBe("quote-context");
    expect(result.confidence).toBe(0.7);
  });

  it("does not collapse whitespace while matching", () => {
    const anchor = createRangeAnchor("a b", { start: 0, end: 3 }, { trim: false });
    expect(findRangeAnchor("a  b", anchor)).toMatchObject({ status: "not-found", reason: "quote-not-found" });
  });
});

describe("refreshing anchors", () => {
  it("is explicit, read-only, and can refresh from found results or text ranges", () => {
    const anchor = createRangeAnchor("before target after", { start: 7, end: 13 }, { contextLength: 3 });
    const original = structuredClone(anchor);
    const found = expectFound(findRangeAnchor("NEW before target after", anchor));
    const refreshed = refreshRangeAnchor("NEW before target after", found, { contextLength: 4 });
    expect(anchor).toEqual(original);
    expect(refreshed.position).toEqual({ start: 11, end: 17 });
    expect(refreshed.quote).toEqual({ exact: "target", prefix: "ore ", suffix: " aft" });

    expect(refreshRangeAnchor("abcde", { start: 1, end: 4 }).quote.exact).toBe("bcd");
    expect(() => refreshRangeAnchor("abc", { status: "not-found", reason: "quote-not-found", anchor } as never)).toThrow();
  });
});

describe("text changes", () => {
  it("diffs insertion, deletion, replacement, no-op, and whole-text replacement", () => {
    expect(diffTextChange("abc", "abXc")).toEqual({ start: 2, end: 2, insert: "X" });
    expect(diffTextChange("abXc", "abc")).toEqual({ start: 2, end: 3, insert: "" });
    expect(diffTextChange("abc", "aXc")).toEqual({ start: 1, end: 2, insert: "X" });
    expect(diffTextChange("abc", "abc")).toEqual({ start: 3, end: 3, insert: "" });
    expect(diffTextChange("abc", "XYZ")).toEqual({ start: 0, end: 3, insert: "XYZ" });
  });

  it("updates anchors for before and inside changes and refreshes quote/context/position", () => {
    const previousText = "alpha target omega";
    const anchor = createRangeAnchor(previousText, { start: 6, end: 12 }, { contextLength: 2 });

    const shifted = updateRangeAnchors({ previousText, nextText: "NEW alpha target omega", anchors: [anchor] })[0]!;
    expect(shifted.status).toBe("shifted");
    if (shifted.status !== "invalidated") expect(shifted.anchor.position).toEqual({ start: 10, end: 16 });

    const expanded = updateRangeAnchors({ previousText, nextText: "alpha tarBIGget omega", anchors: [anchor] })[0]!;
    expect(expanded.status).toBe("expanded");
    if (expanded.status !== "invalidated") expect(expanded.anchor.quote.exact).toBe("tarBIGget");

    const shrunk = updateRangeAnchors({ previousText, nextText: "alpha taget omega", anchors: [anchor] })[0]!;
    expect(shrunk.status).toBe("shrunk");
    if (shrunk.status !== "invalidated") expect(shrunk.anchor.quote.exact).toBe("taget");

    const changed = updateRangeAnchors({ previousText, nextText: "alpha tarXYZ omega", anchors: [anchor], changes: { start: 9, end: 12, insert: "XYZ" } })[0]!;
    expect(changed.status).toBe("changed");
    if (changed.status !== "invalidated") expect(changed.anchor.quote.exact).toBe("tarXYZ");
  });

  it("supports multiple original-coordinate changes and rejects invalid change sets", () => {
    const previousText = "aa target zz";
    const anchor = createRangeAnchor(previousText, { start: 3, end: 9 });
    const result = updateRangeAnchors({
      previousText,
      nextText: "a target zzzz",
      anchors: [anchor],
      changes: [
        { start: 1, end: 2, insert: "" },
        { start: 11, end: 11, insert: "zz" }
      ]
    })[0]!;
    expect(result.status).toBe("shifted");
    if (result.status !== "invalidated") expect(result.range).toEqual({ start: 2, end: 8 });

    expect(() => updateRangeAnchors({ previousText, nextText: previousText, anchors: [anchor], changes: [{ start: 5, end: 6, insert: "" }, { start: 4, end: 4, insert: "x" }] })).toThrow(/ordered/);
    expect(() => updateRangeAnchors({ previousText, nextText: previousText, anchors: [anchor], changes: [{ start: 4, end: 7, insert: "" }, { start: 6, end: 8, insert: "" }] })).toThrow(/ordered/);
  });

  it("invalidates whole deletion and destructive boundary overlaps", () => {
    const previousText = "alpha target omega";
    const anchor = createRangeAnchor(previousText, { start: 6, end: 12 });
    expect(updateRangeAnchors({ previousText, nextText: "alpha  omega", anchors: [anchor] })[0]).toMatchObject({ status: "invalidated" });
    expect(updateRangeAnchors({ previousText, nextText: "alrget omega", anchors: [anchor], changes: { start: 2, end: 8, insert: "" } })[0]).toMatchObject({ status: "invalidated" });
  });
});

describe("DOM adapters", () => {
  it("round-trips offsets and DOM ranges across nested text nodes", () => {
    document.body.innerHTML = `<div id="root">one <strong>two <em>three</em></strong> four</div>`;
    const root = document.getElementById("root")!;
    expect(getDomText(root)).toBe("one two three four");
    const domRange = offsetsToDomRange(root, { start: 4, end: 13 });
    expect(domRange.toString()).toBe("two three");
    expect(domRangeToOffsets(root, domRange)).toEqual({ start: 4, end: 13 });
  });

  it("creates and finds DOM Range Anchors through text-first behavior", () => {
    document.body.innerHTML = `<div id="root">before <strong>target</strong> after</div>`;
    const root = document.getElementById("root")!;
    const range = offsetsToDomRange(root, { start: 7, end: 13 });
    const anchor = createDomRangeAnchor(root, range);
    root.insertBefore(document.createTextNode("NEW "), root.firstChild);
    const result = findDomRangeAnchor(root, anchor);
    expect(result.status).toBe("found");
    if (result.status === "found") {
      expect(result.range).toEqual({ start: 11, end: 17 });
      expect(result.domRange.toString()).toBe("target");
    }
  });
});
