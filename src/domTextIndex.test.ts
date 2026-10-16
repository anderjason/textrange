import { describe, expect, it } from "vitest";
import { createDomTextIndex } from "./domTextIndex.js";

describe("DOM Text Index", () => {
  it("is a snapshot of text-node-order DOM content", () => {
    document.body.innerHTML = `<div id="root">one <strong>two</strong></div>`;
    const root = document.getElementById("root")!;
    const index = createDomTextIndex(root);
    root.append(" three");
    expect(index.text).toBe("one two");
    expect(createDomTextIndex(root).text).toBe("one two three");
  });

  it("converts between Text Ranges and DOM Ranges using the indexed snapshot", () => {
    document.body.innerHTML = `<div id="root">one <strong>two <em>three</em></strong> four</div>`;
    const root = document.getElementById("root")!;
    const index = createDomTextIndex(root);
    const domRange = index.offsetsToDomRange({ start: 4, end: 13 });
    expect(domRange.toString()).toBe("two three");
    expect(index.domRangeToOffsets(domRange)).toEqual({ start: 4, end: 13 });
  });

  it("rejects out-of-root DOM Ranges", () => {
    document.body.innerHTML = `<div id="root">inside</div><div id="other">outside</div>`;
    const root = document.getElementById("root")!;
    const other = document.getElementById("other")!;
    const range = document.createRange();
    range.selectNodeContents(other.firstChild!);
    expect(() => createDomTextIndex(root).domRangeToOffsets(range)).toThrow(/not within a text node/);
  });
});
