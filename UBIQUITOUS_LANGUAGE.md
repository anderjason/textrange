# Ubiquitous Language

## Text Range Anchoring

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Text Range** | A contiguous span of text identified by start and end offsets in a text snapshot. | Selection, range when DOM `Range` is meant |
| **Range Anchor** | A durable description of a **Text Range** that can be found again after the surrounding text changes. | Anchor, saved range, marker |
| **Quote** | The exact selected text stored inside a **Range Anchor**. | Exact, selected text |
| **Context** | The prefix and suffix text stored around a **Quote** to help find repeated text accurately. | Surrounding text, prefix/suffix when discussing the concept |
| **Position** | The start and end offsets where a **Text Range** appeared in a specific text snapshot. | Index, location |
| **Resolution** | The outcome of trying to find a **Range Anchor** in a current text snapshot. | Resolve, lookup |
| **Candidate** | A possible current location for a **Range Anchor** during resolution. | Match |
| **Ambiguity** | The condition where multiple **Candidates** are plausible and none is clearly better. | Tie, conflict |
| **Refresh** | The explicit act of creating a new **Range Anchor** from a successful **Resolution** and the current text. | Rebase, update |

## Text Changes

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Text Change** | A replacement of one contiguous span of old text with inserted text. | Edit, patch, diff |
| **Change Set** | An ordered, non-overlapping list of **Text Changes** based on the same previous text snapshot. | Edit array, transaction |
| **Tracked Range** | A **Range Anchor** that an application keeps updated as **Text Changes** occur. | Mutating anchor, live anchor |
| **Invalidated Range** | A **Tracked Range** that can no longer be preserved after a destructive overlapping **Text Change**. | Deleted anchor, broken anchor |

## DOM Integration

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **DOM Range** | The browser `Range` object representing a span across DOM text nodes. | Range when text offsets are meant |
| **DOM Text Index** | A mapping between concatenated DOM text-node content and the original DOM text node boundaries. | Text index |
| **Native Highlight** | A browser highlight rendered with the CSS Custom Highlight API. | Highlight when annotation meaning is meant |

## Relationships

- A **Range Anchor** describes exactly one intended **Text Range**.
- A **Range Anchor** contains one **Quote**, optional **Context**, and optional **Position**.
- A **Resolution** may produce one current **Text Range**, multiple **Candidates**, or an **Ambiguity**.
- A **Refresh** uses a successful **Resolution** to produce a new **Range Anchor**.
- A **Text Change** can shift, expand, shrink, or invalidate a **Tracked Range**.
- A **DOM Text Index** converts between **Text Range** offsets and a **DOM Range**.
- A **Native Highlight** renders a resolved **DOM Range** but is not part of the v0.1 core package.

## Example Dialogue

> **Dev:** "When a user selects text, do we store the **DOM Range**?"
>
> **Domain expert:** "No. We create a **Range Anchor** from the selected **Text Range** so it can be found again later."
>
> **Dev:** "If the surrounding text changes, do we mutate the **Range Anchor** during **Resolution**?"
>
> **Domain expert:** "No. **Resolution** is read-only. A **Refresh** explicitly creates a new **Range Anchor** from the current text."
>
> **Dev:** "What happens when the user types inside a saved range?"
>
> **Domain expert:** "That is a **Tracked Range** update. Apply the **Text Change** so the range can expand, shrink, or become an **Invalidated Range**."

## Flagged Ambiguities

- "Anchor" is standards-aligned and acceptable, but by itself can still be vague in code and discussion. Prefer **Range Anchor** in domain language and API names such as `createRangeAnchor`.
- "Range" can mean a plain text offset span or a browser `Range`. Use **Text Range** for offsets and **DOM Range** for the browser object.
- "Resolve" is precise engineering language, but "find" may be more intuitive in API names. Keep **Resolution** as the domain concept and consider `findRangeAnchor` as the public function name.
- "Rebase" is too version-control-oriented for this domain. Prefer **Refresh** for explicitly creating an updated **Range Anchor** after a successful **Resolution**.
- "Edit" was used for both user editing behavior and formal text replacement operations. Prefer **Text Change** for the library input and **Change Set** for multiple changes.
