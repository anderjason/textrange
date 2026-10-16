# @anderjason/textrange

A small TypeScript library for durable text range anchoring. It creates a **Range Anchor** from text offsets, finds that anchor in a later text snapshot, refreshes anchors explicitly after successful finds, updates anchors across text changes, and bridges browser `Range` objects to the text-first core.

## Status

The API is at version 0.1 and is still under development. This repository is public for use and reference, but it is not accepting external contributions or pull requests at this time.

## Install

The package has not been published yet. After it is published:

```sh
npm install @anderjason/textrange
```

`@anderjason/textrange` is ESM-only and ships generated TypeScript declarations.

## Create and find a Range Anchor

```ts
import { createRangeAnchor, findRangeAnchor } from "@anderjason/textrange";

const text = "The repeated phrase appears once, then repeated phrase appears again.";
const anchor = createRangeAnchor(text, { start: 39, end: 54 }, { contextLength: 16 });

const currentText = `Inserted text. ${text}`;
const result = findRangeAnchor(currentText, anchor);

if (result.status === "found") {
  console.log(result.range, result.matchPath, result.confidence);
} else {
  console.log(result.reason, result.candidates);
}
```

Anchors store grouped quote and position selectors:

```ts
{
  quote: {
    exact: "repeated phrase",
    prefix: "once, then ",
    suffix: " appears again"
  },
  position: { start: 39, end: 54 }
}
```

Creation trims leading and trailing whitespace by default. Pass `{ trim: false }` to preserve exact whitespace. The default context length is 32 characters.

## Refresh after a successful find

Finding is read-only and never mutates the input anchor. When you decide a successful find should become the new stored state, refresh explicitly:

```ts
import { refreshRangeAnchor } from "@anderjason/textrange";

const found = findRangeAnchor(currentText, anchor);
if (found.status === "found") {
  const refreshed = refreshRangeAnchor(currentText, found);
  // Save refreshed in your application storage.
}
```

You can also refresh from an explicit text range:

```ts
const refreshed = refreshRangeAnchor(currentText, { start: 10, end: 20 });
```

## Update anchors across text changes

Use `diffTextChange` for one contiguous before/after change, or pass an ordered non-overlapping change set in original previous-text coordinates.

```ts
import { diffTextChange, updateRangeAnchors } from "@anderjason/textrange";

const previousText = "alpha target omega";
const nextText = "alpha tarBIGget omega";
const change = diffTextChange(previousText, nextText);

const [updated] = updateRangeAnchors({
  previousText,
  nextText,
  anchors: [anchor],
  changes: change
});

if (updated.status !== "invalidated") {
  console.log(updated.status); // expanded, shifted, shrunk, changed, unchanged
  console.log(updated.anchor);
}
```

Updated anchors refresh quote, context, and position from the next text. Whole-anchor deletion and destructive boundary-overlapping changes return `invalidated` results.

## DOM adapters

The DOM APIs are thin adapters over the text-first core. Text is indexed by walking text nodes in document order.

```ts
import {
  createDomRangeAnchor,
  findDomRangeAnchor,
  offsetsToDomRange,
  domRangeToOffsets
} from "@anderjason/textrange";

const root = document.querySelector("article")!;
const selectionRange = document.getSelection()!.getRangeAt(0);
const anchor = createDomRangeAnchor(root, selectionRange);

const result = findDomRangeAnchor(root, anchor);
if (result.status === "found") {
  CSS.highlights.set("annotation", new Highlight(result.domRange));
}
```

## Public API

- `createRangeAnchor(text, range, options?)`
- `findRangeAnchor(text, anchor)`
- `refreshRangeAnchor(text, foundResultOrRange, options?)`
- `diffTextChange(previousText, nextText)`
- `updateRangeAnchors(args)`
- `getDomText(root)`
- `domRangeToOffsets(root, range)`
- `offsetsToDomRange(root, textRange)`
- `createDomRangeAnchor(root, range, options?)`
- `findDomRangeAnchor(root, anchor)`

Important public types include `RangeAnchor`, `TextQuoteSelector`, `TextPositionSelector`, `TextRange`, `TextChange`, and `FindRangeAnchorResult`.

## v0.1 limitations

- Matching is literal. There is no whitespace collapsing, Unicode normalization, fuzzy quote matching, or semantic matching.
- Ambiguity handling is strict. Repeated quote text without a clear context winner returns `not-found` with reason `ambiguous` and candidate ranges.
- `diffTextChange` derives one contiguous text change, not a full diff.
- Change sets must be ordered, non-overlapping, and expressed in previous-text coordinates.
- DOM support is limited to text-node-order semantics. It does not synthesize block separators, inspect CSS visibility, traverse shadow DOM, or provide editor-specific document model adapters.
- Native highlighting is demo code, not a package abstraction.
- The package does not include storage, sync, IDs, comments, popovers, fallback rendering, CommonJS output, release automation, or editor adapters.

## Development

```sh
npm ci --ignore-scripts
npm run typecheck
npm test
npm run build
npm run pack:check
```

## Security

Report suspected vulnerabilities privately as described in [SECURITY.md](SECURITY.md). Dependency controls and repository checks are documented in [REPO-SECURITY.md](REPO-SECURITY.md).

## Contributing

External contributions and pull requests are not accepted at this time. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
