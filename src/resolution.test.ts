import { describe, expect, it } from "vitest";
import { findRangeAnchor, quoteCandidates } from "./resolution.js";

describe("Resolution Candidate policy", () => {
  it("scores Quote Candidates by exact quote plus matching Context sides", () => {
    expect(quoteCandidates("bctargetxtargetde", { quote: { exact: "target", prefix: "abc", suffix: "def" } })).toEqual([
      { range: { start: 2, end: 8 }, confidence: 0.56, prefixScore: 0.67, suffixScore: 0 },
      { range: { start: 9, end: 15 }, confidence: 0.56, prefixScore: 0, suffixScore: 0.67 }
    ]);
  });

  it("requires a perfect Context side and clear margin before choosing among repeated Quotes", () => {
    const weak = findRangeAnchor("bctargetxtargetde", { quote: { exact: "target", prefix: "abc", suffix: "def" } });
    expect(weak).toMatchObject({ status: "not-found", reason: "ambiguous" });

    const strong = findRangeAnchor("payment details, payment details for invoices", {
      quote: { exact: "payment details", prefix: "ote mentions ", suffix: " for invoices" },
      position: { start: 18, end: 33 }
    });
    expect(strong).toMatchObject({ status: "found", matchPath: "quote-context", range: { start: 17, end: 32 }, confidence: 0.69 });
  });
});
