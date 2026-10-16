import { createRangeAnchor, type CreateRangeAnchorOptions, type RangeAnchor } from "./rangeAnchor.js";
import type { FoundRangeAnchorResult } from "./resolution.js";
import type { TextRange } from "./textRange.js";

export function refreshRangeAnchor(text: string, foundOrRange: FoundRangeAnchorResult | TextRange, options: CreateRangeAnchorOptions = {}): RangeAnchor {
  if ("status" in foundOrRange) {
    if (foundOrRange.status !== "found") throw new Error("Cannot refresh a Range Anchor from a not-found result");
    return createRangeAnchor(text, foundOrRange.range, options);
  }
  return createRangeAnchor(text, foundOrRange, options);
}
