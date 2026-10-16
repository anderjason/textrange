import { rangeFromAnchor, type RangeAnchor } from "./rangeAnchor.js";
import type { TextRange } from "./textRange.js";

export interface FoundRangeAnchorResult {
  status: "found";
  range: TextRange;
  anchor: RangeAnchor;
  matchPath: "position" | "quote-context" | "quote";
  confidence: number;
}

export interface RangeAnchorCandidate {
  range: TextRange;
  confidence: number;
  prefixScore: number;
  suffixScore: number;
}

export interface NotFoundRangeAnchorResult {
  status: "not-found";
  reason: "quote-not-found" | "ambiguous" | "invalid-anchor";
  anchor: RangeAnchor;
  candidates?: RangeAnchorCandidate[];
}

export type FindRangeAnchorResult = FoundRangeAnchorResult | NotFoundRangeAnchorResult;

const SCORE_DECIMAL_PLACES = 2;
const CLEAR_CANDIDATE_MARGIN = 0.25;

function roundScore(value: number): number {
  const factor = 10 ** SCORE_DECIMAL_PLACES;
  return Math.round(value * factor) / factor;
}

function commonPrefixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i++;
  return i;
}

function commonSuffixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
  return i;
}

export function quoteCandidates(text: string, anchor: RangeAnchor): RangeAnchorCandidate[] {
  const exact = anchor.quote.exact;
  if (exact.length === 0) return [];
  const candidates: RangeAnchorCandidate[] = [];
  let from = 0;
  while (from <= text.length) {
    const start = text.indexOf(exact, from);
    if (start === -1) break;
    const end = start + exact.length;
    const prefix = anchor.quote.prefix ?? "";
    const suffix = anchor.quote.suffix ?? "";
    const actualPrefix = text.slice(Math.max(0, start - prefix.length), start);
    const actualSuffix = text.slice(end, Math.min(text.length, end + suffix.length));
    const prefixScore = roundScore(prefix.length === 0 ? 0 : commonSuffixLength(prefix, actualPrefix) / prefix.length);
    const suffixScore = roundScore(suffix.length === 0 ? 0 : commonPrefixLength(suffix, actualSuffix) / suffix.length);
    const confidence = roundScore((prefixScore + suffixScore + 1) / ((prefix.length > 0 ? 1 : 0) + (suffix.length > 0 ? 1 : 0) + 1));
    candidates.push({ range: { start, end }, confidence, prefixScore, suffixScore });
    from = start + Math.max(1, exact.length);
  }
  return candidates;
}

export function findRangeAnchor(text: string, anchor: RangeAnchor): FindRangeAnchorResult {
  if (anchor.quote.exact.length === 0) return { status: "not-found", reason: "invalid-anchor", anchor };

  const position = rangeFromAnchor(anchor);
  if (position && position.start >= 0 && position.end <= text.length && text.slice(position.start, position.end) === anchor.quote.exact) {
    return { status: "found", range: position, anchor, matchPath: "position", confidence: 1 };
  }

  const candidates = quoteCandidates(text, anchor);
  if (candidates.length === 0) return { status: "not-found", reason: "quote-not-found", anchor };
  if (candidates.length === 1) return { status: "found", range: candidates[0]!.range, anchor, matchPath: "quote", confidence: candidates[0]!.confidence };

  const sorted = [...candidates].sort((a, b) => b.confidence - a.confidence);
  const best = sorted[0]!;
  const second = sorted[1]!;
  const hasPerfectContextSide = best.prefixScore === 1 || best.suffixScore === 1;
  const hasClearMargin = best.confidence - second.confidence >= CLEAR_CANDIDATE_MARGIN;
  if ((best.confidence === 1 && best.confidence > second.confidence) || (hasPerfectContextSide && hasClearMargin)) {
    return { status: "found", range: best.range, anchor, matchPath: "quote-context", confidence: best.confidence };
  }
  return { status: "not-found", reason: "ambiguous", anchor, candidates };
}
