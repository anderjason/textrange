export interface TextRange {
  start: number;
  end: number;
}

export function assertRange(text: string, range: TextRange): void {
  if (!Number.isInteger(range.start) || !Number.isInteger(range.end) || range.start < 0 || range.end < range.start || range.end > text.length) {
    throw new RangeError(`Invalid text range ${range.start}-${range.end} for text length ${text.length}`);
  }
}
