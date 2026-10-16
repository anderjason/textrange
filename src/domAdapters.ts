import { createRangeAnchor, type CreateRangeAnchorOptions, type RangeAnchor } from "./rangeAnchor.js";
import { findRangeAnchor, type FoundRangeAnchorResult, type NotFoundRangeAnchorResult } from "./resolution.js";
import { createDomTextIndex } from "./domTextIndex.js";

export function createDomRangeAnchor(root: Node, range: Range, options: CreateRangeAnchorOptions = {}): RangeAnchor {
  const index = createDomTextIndex(root);
  return createRangeAnchor(index.text, index.domRangeToOffsets(range), options);
}

export function findDomRangeAnchor(root: Node, anchor: RangeAnchor): (FoundRangeAnchorResult & { domRange: Range }) | NotFoundRangeAnchorResult {
  const index = createDomTextIndex(root);
  const result = findRangeAnchor(index.text, anchor);
  if (result.status === "found") return { ...result, domRange: index.offsetsToDomRange(result.range) };
  return result;
}
