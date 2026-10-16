import { createRangeAnchor, type RangeAnchor } from "./rangeAnchor.js";
import { normalizeChangeSet, type TextChange } from "./textChange.js";
import type { TextRange } from "./textRange.js";

export type UpdateRangeAnchorStatus = "unchanged" | "shifted" | "expanded" | "shrunk" | "changed" | "invalidated";

export type UpdateRangeAnchorResult =
  | { status: Exclude<UpdateRangeAnchorStatus, "invalidated">; anchor: RangeAnchor; range: TextRange; previousAnchor: RangeAnchor }
  | { status: "invalidated"; reason: string; previousAnchor: RangeAnchor };

function statusFromFlags(flags: Set<UpdateRangeAnchorStatus>, shifted: boolean): Exclude<UpdateRangeAnchorStatus, "invalidated"> {
  if (flags.has("changed")) return "changed";
  if (flags.has("expanded")) return "expanded";
  if (flags.has("shrunk")) return "shrunk";
  if (shifted) return "shifted";
  return "unchanged";
}

export function updateRangeAnchors(args: {
  previousText: string;
  nextText: string;
  anchors: RangeAnchor[];
  changes?: TextChange | TextChange[];
  contextLength?: number;
}): UpdateRangeAnchorResult[] {
  const changes = normalizeChangeSet(args.changes, args.previousText, args.nextText);

  return args.anchors.map((previousAnchor) => {
    const range = previousAnchor.position;
    if (!range) return { status: "invalidated", reason: "Range Anchor has no position", previousAnchor };
    let start = range.start;
    let end = range.end;
    let shifted = false;
    const flags = new Set<UpdateRangeAnchorStatus>();

    for (const change of changes) {
      const oldLength = change.end - change.start;
      const delta = change.insert.length - oldLength;
      const isInsertion = oldLength === 0 && change.insert.length > 0;
      const isNoop = oldLength === 0 && change.insert.length === 0;

      if (isNoop) continue;

      if (change.end <= range.start) {
        start += delta;
        end += delta;
        if (delta !== 0) shifted = true;
        continue;
      }
      if (change.start >= range.end) continue;

      if (isInsertion) {
        if (change.start > range.start && change.start < range.end) {
          end += delta;
          flags.add("expanded");
        } else if (change.start <= range.start) {
          start += delta;
          end += delta;
          shifted = true;
        }
        continue;
      }

      if (change.start <= range.start && change.end >= range.end) {
        return { status: "invalidated", reason: "Text change removed the whole range anchor", previousAnchor };
      }
      if (change.start < range.start && change.end > range.start) {
        return { status: "invalidated", reason: "Text change destructively overlaps the start boundary", previousAnchor };
      }
      if (change.start < range.end && change.end > range.end) {
        return { status: "invalidated", reason: "Text change destructively overlaps the end boundary", previousAnchor };
      }

      if (change.start >= range.start && change.end <= range.end) {
        end += delta;
        if (end <= start) return { status: "invalidated", reason: "Text change left no coherent non-empty range", previousAnchor };
        if (change.insert.length === 0) flags.add("shrunk");
        else if (delta > 0) flags.add("expanded");
        else if (delta < 0) flags.add("shrunk");
        else flags.add("changed");
      }
    }

    const nextRange = { start, end };
    const anchor = createRangeAnchor(args.nextText, nextRange, { trim: false, contextLength: args.contextLength });
    return { status: statusFromFlags(flags, shifted), anchor, range: nextRange, previousAnchor };
  });
}
