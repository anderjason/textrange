export interface TextChange {
  start: number;
  end: number;
  insert: string;
}

export function diffTextChange(previousText: string, nextText: string): TextChange {
  let start = 0;
  while (start < previousText.length && start < nextText.length && previousText[start] === nextText[start]) start++;
  let previousEnd = previousText.length;
  let nextEnd = nextText.length;
  while (previousEnd > start && nextEnd > start && previousText[previousEnd - 1] === nextText[nextEnd - 1]) {
    previousEnd--;
    nextEnd--;
  }
  return { start, end: previousEnd, insert: nextText.slice(start, nextEnd) };
}

export function normalizeChangeSet(changes: TextChange | TextChange[] | undefined, previousText: string, nextText: string): TextChange[] {
  const changeSet = Array.isArray(changes) ? changes : changes ? [changes] : [diffTextChange(previousText, nextText)];
  validateChangeSet(changeSet, previousText);
  return changeSet;
}

export function validateChangeSet(changes: TextChange[], previousText: string): void {
  let lastEnd = 0;
  for (const change of changes) {
    if (!Number.isInteger(change.start) || !Number.isInteger(change.end) || change.start < 0 || change.end < change.start || change.end > previousText.length) {
      throw new RangeError(`Invalid TextChange ${change.start}-${change.end}`);
    }
    if (change.start < lastEnd) throw new Error("Text changes must be ordered and non-overlapping in previous-text coordinates");
    lastEnd = change.end;
  }
}
