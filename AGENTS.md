# Agent Instructions

## Implementation Depth

When a request is ambiguous, do not assume the user wants the minimal fix. The default is to do the right fix.

Prefer to:

- identify the underlying cause, not just the visible symptom
- ask a clarifying question if there are multiple plausible interpretations
- preserve or improve the architecture rather than layering on one-off patches
- take the time needed to make behavior coherent across similar cases
- update nearby patterns when the same issue is likely to recur

A small patch is appropriate only when it is genuinely the right fix, not merely the fastest fix.

## No Shortcut Fixes

Do not take shortcuts just because the right approach is tedious, time-consuming, or requires many changes.

If the correct fix requires refactoring, touching multiple files, adding tests, or carefully updating related patterns, do that work. The amount of effort required is not a reason to choose an inferior solution.

This is not permission to overengineer. Prefer the simplest design that fully addresses the real problem. But do not leave one-off patches, duplicated logic, inconsistent behavior, or known structural problems in place merely to save time.

Leave the code better than you found it.

## Repo Security

See [REPO-SECURITY.md](REPO-SECURITY.md) for dependency security checks, known gaps, and how to interpret failures.
