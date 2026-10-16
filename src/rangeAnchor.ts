import { assertRange, type TextRange } from "./textRange.js";

export interface TextQuoteSelector {
  exact: string;
  prefix?: string;
  suffix?: string;
}

export interface TextPositionSelector extends TextRange {}

export interface RangeAnchor {
  quote: TextQuoteSelector;
  position?: TextPositionSelector;
}

export interface CreateRangeAnchorOptions {
  trim?: boolean;
  contextLength?: number;
  includePosition?: boolean;
}

export const DEFAULT_CONTEXT_LENGTH = 32;

function normalizeCreateOptions(options: CreateRangeAnchorOptions = {}): Required<CreateRangeAnchorOptions> {
  return {
    trim: options.trim ?? true,
    contextLength: options.contextLength ?? DEFAULT_CONTEXT_LENGTH,
    includePosition: options.includePosition ?? true
  };
}

export function rangeFromAnchor(anchor: RangeAnchor): TextRange | undefined {
  return anchor.position == null ? undefined : { start: anchor.position.start, end: anchor.position.end };
}

export function createRangeAnchor(text: string, range: TextRange, options: CreateRangeAnchorOptions = {}): RangeAnchor {
  const opts = normalizeCreateOptions(options);
  assertRange(text, range);

  let start = range.start;
  let end = range.end;
  if (opts.trim) {
    const selected = text.slice(start, end);
    const leading = selected.match(/^\s*/)?.[0].length ?? 0;
    const trailing = selected.match(/\s*$/)?.[0].length ?? 0;
    start += leading;
    end -= trailing;
  }

  assertRange(text, { start, end });
  const prefixStart = Math.max(0, start - opts.contextLength);
  const suffixEnd = Math.min(text.length, end + opts.contextLength);
  const prefix = text.slice(prefixStart, start);
  const suffix = text.slice(end, suffixEnd);
  const anchor: RangeAnchor = {
    quote: {
      exact: text.slice(start, end),
      ...(prefix.length > 0 ? { prefix } : {}),
      ...(suffix.length > 0 ? { suffix } : {})
    }
  };
  if (opts.includePosition) {
    anchor.position = { start, end };
  }
  return anchor;
}
