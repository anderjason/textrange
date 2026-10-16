import type { TextRange } from "./textRange.js";

export interface DomTextIndex {
  readonly root: Node;
  readonly text: string;
  domRangeToOffsets(range: Range): TextRange;
  offsetsToDomRange(textRange: TextRange): Range;
}

type DomTextBoundary = { node: Text; offset: number };

function textNodesIn(root: Node): Text[] {
  const doc = root.ownerDocument ?? (root.nodeType === Node.DOCUMENT_NODE ? (root as Document) : document);
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    nodes.push(node as Text);
    node = walker.nextNode();
  }
  return nodes;
}

function boundaryForOffset(nodes: Text[], target: number): DomTextBoundary {
  let offset = 0;
  for (const node of nodes) {
    const next = offset + node.data.length;
    if (target <= next) return { node, offset: target - offset };
    offset = next;
  }
  const last = nodes[nodes.length - 1];
  if (!last) throw new Error("Cannot convert offsets in a root with no text nodes");
  return { node: last, offset: last.data.length };
}

export function createDomTextIndex(root: Node): DomTextIndex {
  const nodes = textNodesIn(root);
  const text = nodes.map((node) => node.data).join("");

  return {
    root,
    text,
    domRangeToOffsets(range: Range): TextRange {
      let offset = 0;
      let start: number | undefined;
      let end: number | undefined;
      for (const node of nodes) {
        if (range.startContainer === node) start = offset + range.startOffset;
        if (range.endContainer === node) end = offset + range.endOffset;
        offset += node.data.length;
      }
      if (start == null || end == null) throw new Error("DOM Range boundary is not within a text node under root");
      if (start > end) throw new Error("DOM Range start must be before end");
      return { start, end };
    },
    offsetsToDomRange(textRange: TextRange): Range {
      const doc = root.ownerDocument ?? document;
      if (textRange.start < 0 || textRange.end < textRange.start || textRange.end > text.length) throw new RangeError("Text range is outside root text");
      const range = doc.createRange();
      const startBoundary = boundaryForOffset(nodes, textRange.start);
      const endBoundary = boundaryForOffset(nodes, textRange.end);
      range.setStart(startBoundary.node, startBoundary.offset);
      range.setEnd(endBoundary.node, endBoundary.offset);
      return range;
    }
  };
}

export function getDomText(root: Node): string {
  return createDomTextIndex(root).text;
}

export function domRangeToOffsets(root: Node, range: Range): TextRange {
  return createDomTextIndex(root).domRangeToOffsets(range);
}

export function offsetsToDomRange(root: Node, textRange: TextRange): Range {
  return createDomTextIndex(root).offsetsToDomRange(textRange);
}
