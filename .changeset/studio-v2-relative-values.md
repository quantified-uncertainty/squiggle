---
"@quri/squiggle-relative-values": minor
"@quri/squiggle-studio": minor
---

Relative values in Squiggle Studio v2, and fixes in the library.

Library (`@quri/squiggle-relative-values`):

- Spec detection is looser than validation: a dict with `fn` and `items`, or with a `values` dict, is a candidate whatever its value types, so a mistake (a string among the values, a non-function `fn`) shows its validation message instead of the spec silently disappearing.
- A point ratio (p5 = p95, e.g. an item worth 0) has uncertainty 0 instead of failing validation with NaN.
- The list sidebar's pair charts no longer re-run the model with appended code: they use the evaluator's comparison function, so numbers as values, a trailing result expression and imports work, and chart errors never point into the user's file (`relativeValuesPairCharts`, `ModelEvaluator.comparePairValues`). The dashboard's `linker` and `sourceId` options are unused now.
- The list view keeps its unit and sidebar pair as ids resolved against the current definition: the unit follows `recommendedUnit` until the user picks one and falls back when the picked item is removed; the sidebar closes when one of its items disappears and shows current names.
- The pair sidebar becomes an overlay drawer (with a close button and Esc) when the list is narrower than 900 px.
- The list view colors its cells from the n pairs it shows and only precomputes those, instead of all n² pairs.
- `relativeValuesBundleToCsv(bundle, { metric, long })`: a wide matrix (`ERR` for failed comparisons) or tidy rows.
- The grid's Row Settings, Column Settings and Cluster Diagram buttons stay on one line each and wrap as a row in a narrow view, and each grid cell's `data-testid="rv-grid-cell"` element is the cell's own box (it was a `display: contents` wrapper, which can't be measured or clicked).

Studio (`@quri/squiggle-studio`):

- The relative values view's spec picker and List / Grid / Plot tabs are in the editor header; the dashboard has no tab bar or title of its own.
- While you type, the dashboard keeps its evaluator and swaps after 600 ms without changes or on save; pairs are cached by what the model computes, so comment and whitespace edits recompute nothing.
- `?tab=` and `?variable=` are initial state for the `?file=` file only, and the address bar mirrors the shown tab and spec. In embed mode (`render`) they're authoritative, and an unknown spec or an invalid one is a `data-studio-error`.
- A file keeps its Relative values view while its spec is invalid or mid-edit.
- `squiggle-studio rv <file> [--variable] [--format json|csv] [--metric] [--unit] [--long] [--precision] [--root]` prints the pair matrix without a browser; `window.squiggleStudio.getRvMatrix()` and Run ▸ Copy for Agent ▸ Relative Values as CSV give the same numbers in the page.
