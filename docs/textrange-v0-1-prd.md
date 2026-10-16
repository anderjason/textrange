# PRD: Extract Text Range Engine Into `@anderjason/textrange`

## Problem Statement

The current text range engine exists as a single HTML prototype that mixes core anchoring behavior, DOM range conversion, demo state, comment UI, disruption controls, and highlighting. This makes it hard to reuse the anchoring logic in real applications, hard to test the core behavior independently, and hard to evolve the project into a high-quality npm library.

Users need a small, reliable library that can create a durable description of a selected text range, find that range again after text changes, refresh stored anchor data intentionally, and keep anchors updated when text edits happen inside or around them.

## Solution

Extract the core text range anchoring behavior into a TypeScript npm package published as `@anderjason/textrange`.

The package will be text-first and browser-friendly. It will expose APIs to create **Range Anchors** from text offsets, find those anchors in later text snapshots, refresh anchors explicitly after successful finds, derive simple text changes from before/after text, update anchors across text changes, and adapt between DOM `Range` objects and text offsets.

The existing prototype will become a browser demo that consumes the package. The demo can continue to show comments, strikes, and native Custom Highlight API usage, but those UI and rendering concerns are not part of the v0.1 package.

The repo should be structured like a real library from the start: package boundary, package metadata, explicit exports, README, TypeScript declarations, tests, and example app are first-class v0.1 work.

## User Stories

1. As an application developer, I want to create a Range Anchor from selected text offsets, so that I can store a durable reference to a text range.
2. As an application developer, I want a Range Anchor to store quote text and surrounding context, so that repeated text can be found more accurately later.
3. As an application developer, I want a Range Anchor to optionally store original position offsets, so that finding the range can use a fast path when the text has not shifted.
4. As an application developer, I want leading and trailing whitespace trimmed by default during anchor creation, so that accidental sloppy selections do not become part of the quote.
5. As an application developer, I want to opt out of selection trimming, so that exact whitespace ranges can be preserved for specialized use cases.
6. As an application developer, I want a default context length of 32 characters on each side, so that anchors are compact but still useful for disambiguation.
7. As an application developer, I want to configure context length, so that applications with different privacy or disambiguation needs can tune anchor storage.
8. As an application developer, I want anchors to avoid generated IDs by default, so that my application remains responsible for annotation identity.
9. As an application developer, I want to find a Range Anchor in a later text snapshot, so that saved annotations can be restored after edits.
10. As an application developer, I want finding to first check position when possible, so that unchanged text resolves quickly and confidently.
11. As an application developer, I want finding to fall back to quote and context matching, so that anchors can survive surrounding insertions and deletions.
12. As an application developer, I want finding to return structured results, so that I know whether an anchor was found, not found, or ambiguous.
13. As an application developer, I want found results to include the current text range, match path, confidence, and anchor, so that my UI and telemetry can explain what happened.
14. As an application developer, I want not-found results to include a reason, so that I can distinguish missing quotes from ambiguous matches.
15. As an application developer, I want ambiguous repeated text to return candidates instead of choosing recklessly, so that a comment is not shown on the wrong text.
16. As an application developer, I want strict ambiguity handling by default, so that wrong confident highlights are avoided.
17. As an application developer, I want literal text matching in v0.1, so that anchor offsets and matching behavior are easy to reason about.
18. As an application developer, I want no implicit whitespace or Unicode normalization in v0.1, so that stored text and offsets stay consistent.
19. As an application developer, I want to refresh a Range Anchor explicitly after it is found, so that stale position and context can be updated intentionally.
20. As an application developer, I want finding to be read-only, so that previewing anchors does not mutate stored data.
21. As an application developer, I want a refreshed anchor to update quote, context, and position together, so that later finding remains strong.
22. As an editor developer, I want to describe text edits as explicit Text Changes, so that anchors can be updated as users type.
23. As an editor developer, I want a simple before/after diff helper, so that basic contenteditable integrations can derive a Text Change without a full editor transaction model.
24. As an editor developer, I want the diff helper to support one contiguous text change, so that common typing, paste, delete, and replacement flows are covered simply.
25. As an editor developer, I want update APIs to accept a Change Set, so that editors with transactions can update anchors from multiple non-overlapping changes.
26. As an editor developer, I want Change Sets to use original text coordinates, so that all changes are based on a single previous text snapshot.
27. As an editor developer, I want invalid Change Sets to be rejected clearly, so that overlapping or unsorted changes do not corrupt anchors.
28. As an editor developer, I want insertions before an anchor to shift it forward, so that tracked ranges stay attached to the same text.
29. As an editor developer, I want deletions before an anchor to shift it backward, so that tracked ranges stay attached to the same text.
30. As an editor developer, I want insertions inside an anchor to expand it, so that typing inside highlighted text preserves the tracked range.
31. As an editor developer, I want deletions inside an anchor to shrink it, so that tracked ranges reflect removed text.
32. As an editor developer, I want destructive boundary-overlapping changes to invalidate anchors when preservation would be misleading, so that applications can ask for review.
33. As an editor developer, I want update results to report statuses such as shifted, expanded, shrunk, changed, unchanged, and invalidated, so that my app can decide what to save or surface.
34. As a browser application developer, I want to convert a DOM Range to text offsets, so that browser selections can become Range Anchors.
35. As a browser application developer, I want to convert text offsets back to a DOM Range, so that found anchors can be rendered in the document.
36. As a browser application developer, I want DOM adapters to support text-node-order DOM trees, so that formatted text across nodes works in v0.1.
37. As a browser application developer, I want DOM adapters to stay thin, so that text anchoring behavior remains testable without browser APIs.
38. As a browser application developer, I want an example showing native Custom Highlight API usage, so that I can see how to render found DOM Ranges without a separate highlighter package.
39. As a package consumer, I want the library to be TypeScript-first, so that public contracts are discoverable and hard to misuse.
40. As a package consumer, I want ESM-only exports and declaration files, so that modern bundlers and TypeScript projects consume the package cleanly.
41. As a package consumer, I want explicit package exports, so that only intentional public APIs are exposed.
42. As a package consumer, I want a README focused on the create, find, refresh, and update workflow, so that I can adopt the library quickly.
43. As a maintainer, I want text-first modules to be tested independently from DOM adapters, so that the core behavior remains stable and fast to verify.
44. As a maintainer, I want the browser demo to consume the package, so that the demo validates the public API rather than duplicating prototype logic.
45. As a maintainer, I want the repo to follow a high-quality package structure from v0.1, so that publishing does not require a later cleanup pass.

## Implementation Decisions

- Publish only one package for v0.1: `@anderjason/textrange`.
- Defer `@anderjason/textrange-highlight-dom`; native highlighting remains demo code until a separate highlighter abstraction proves enough value.
- Use a small monorepo-style layout with one package and one browser example.
- Treat package metadata, README, explicit exports, tests, and examples as first-class v0.1 deliverables.
- Write the library in TypeScript.
- Publish ESM-only JavaScript with declaration files.
- Use npm workspaces, TypeScript, and Vitest as lean tooling.
- Use **Range Anchor** as the canonical domain term.
- Use `RangeAnchor` as the main public anchor type.
- Model a Range Anchor as a quote selector plus optional position selector.
- Store quote data as exact selected text plus optional prefix and suffix context.
- Store position data as start and end offsets.
- Do not generate anchor IDs in the core library.
- Use text-first APIs as the core behavior.
- Include DOM adapter APIs in the same package.
- Public API names should be `createRangeAnchor`, `findRangeAnchor`, `refreshRangeAnchor`, `diffTextChange`, `updateRangeAnchors`, `createDomRangeAnchor`, `findDomRangeAnchor`, `domRangeToOffsets`, and `offsetsToDomRange`.
- Public type names should include `RangeAnchor`, `TextQuoteSelector`, `TextPositionSelector`, `TextRange`, `TextChange`, and `FindRangeAnchorResult`.
- Use `found` and `not-found` as find result statuses.
- Finding should return rich results instead of only returning a range or null.
- Finding should be read-only and must not mutate anchors.
- Refreshing should be explicit and should create a new anchor from current text.
- Strict ambiguity handling should be the default.
- If repeated quote text has no clearly better candidate, return a not-found result with an ambiguity reason and candidates.
- Capture should trim leading and trailing whitespace by default.
- Capture should allow trimming to be disabled.
- Default context length should be 32 characters.
- Matching should be literal in v0.1, with no whitespace collapsing or Unicode normalization beyond JavaScript string behavior.
- DOM support in v0.1 is limited to text-node-order extraction.
- Do not synthesize block separators, inspect CSS visibility, traverse shadow DOM, or support editor document models in v0.1.
- Text changes should represent contiguous replacements from previous text.
- `diffTextChange` should derive one contiguous Text Change by common prefix and common suffix.
- `updateRangeAnchors` should support one Text Change or an ordered non-overlapping Change Set.
- Change Set offsets should refer to the original previous text, not incrementally updated text.
- Updating anchors should refresh quote, context, and position when next text is available.
- Edits inside anchors should preserve anchors when a coherent range remains.
- Destructive boundary-overlapping changes should invalidate anchors when preservation would be misleading.
- Update results should be structured per input anchor so applications know whether each range was unchanged, shifted, expanded, shrunk, changed, or invalidated.
- The browser demo should consume `@anderjason/textrange` and may use the native Custom Highlight API directly.
- The demo can include comments, strikes, and disruption controls, but those concepts must not leak into the core package.

## Testing Decisions

- Good tests should assert external behavior through public APIs, not implementation details.
- Text-first anchoring should be tested heavily with plain strings.
- Tests should cover anchor creation, default trimming, trimming opt-out, default context length, custom context length, and no generated IDs.
- Tests should cover position fast-path finding.
- Tests should cover quote and context recovery after inserted surrounding text.
- Tests should cover repeated quote text with strong context.
- Tests should cover ambiguous repeated quote text returning an ambiguity result.
- Tests should cover missing quote text returning a not-found result.
- Tests should cover literal whitespace behavior without normalization.
- Tests should cover explicit refresh producing updated quote, context, and position.
- Text change tracking should be tested heavily with plain strings.
- Tests should cover `diffTextChange` for insertion, deletion, replacement, no-op, and whole-text replacement.
- Tests should cover update behavior for changes before, after, inside, and across anchors.
- Tests should cover shifted, expanded, shrunk, changed, unchanged, and invalidated statuses.
- Tests should cover quote/context refresh after updates.
- Tests should cover sorted non-overlapping Change Sets.
- Tests should cover invalid Change Sets, including unsorted and overlapping changes.
- DOM adapters should be tested with focused DOM tests.
- DOM tests should cover text-node-order indexing across formatted text nodes.
- DOM tests should cover converting a DOM Range to text offsets.
- DOM tests should cover converting text offsets back to a DOM Range.
- DOM tests should cover create/find DOM anchor flows using the text-first core.
- Browser demo testing should be light smoke coverage proving the example consumes the package and can render found DOM ranges with native highlighting.
- Prior art is the current `text-range-engine.html` prototype, whose behavior should be preserved where it matches the PRD decisions.

## Out of Scope

- Publishing `@anderjason/textrange-highlight-dom` in v0.1.
- Overlay fallback rendering for browsers without the CSS Custom Highlight API.
- A highlighter abstraction, style injection layer, or highlight lifecycle manager.
- Popover UI, comment UI, selection menus, annotation storage, or sync behavior.
- Editor-specific adapters for ProseMirror, Tiptap, Lexical, Slate, CodeMirror, or Monaco.
- Collaboration, CRDTs, operational transforms, or multi-user conflict handling.
- Full diff algorithms for arbitrary multi-range changes.
- Automatic DOM mutation observation for contenteditable.
- Hidden text rules, generated CSS content, block separator synthesis, table semantics, shadow DOM traversal, PDF text layers, or canvas text.
- Backward compatibility with the prototype’s flat anchor shape.
- CommonJS output.
- Heavy monorepo tooling, release automation, or changeset tooling.

## Further Notes

- The current workspace is not a Git repository, so this PRD is written as a local file instead of being submitted as a GitHub issue.
- The project glossary is maintained separately in `UBIQUITOUS_LANGUAGE.md`.
- The grill-me decision log is maintained under `docs/grill-me/001-extract-engine`.
- The repo-quality target is inspired by `pierrecomputer/pierre`: deliberate package boundaries, strict manifests, explicit exports, package README, package-local tests, and examples that consume public APIs.
