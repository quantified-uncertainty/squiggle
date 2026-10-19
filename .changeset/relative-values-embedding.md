---
"@quri/squiggle-relative-values": minor
"@quri/ui": patch
"@quri/squiggle-studio": patch
---

Relative values dashboards are easy to embed in other React apps:

- `@quri/squiggle-relative-values/styles.css`: a self-contained stylesheet scoped to the dashboards (`.squiggle-rv`). It doesn't restyle the host page, and the page's element styles don't leak into the dashboards. `full.css` is unchanged.
- Customization props on all dashboards: `tabs` (choose and reorder the built-in tabs, add custom tabs with `{ id, label, icon?, render(context) }`), `onItemClick`, `renderItemName`, `className`, `height` and `clusterOverrides`.
- Precomputed bundles: a versioned JSON format (`RelativeValuesBundle`) with all pairs of a spec, the `squiggle-rv bundle <file.squiggle>` CLI command to generate it, `ModelEvaluator.fromBundle` / `fromCache` (cache-only evaluators), `RelativeValuesBundleDashboard`, and `createRelativeValuesBundle` / `parseRelativeValuesBundle` / `stringifyRelativeValuesBundle`.
- Non-blocking evaluation: `ModelEvaluator.computeAll` / `computePairs` compute in chunks with `AbortSignal` and progress callbacks; dashboards use them, with a progress bar, instead of freezing the page for large models (`precompute={false}` restores the old behavior).
- `@quri/squiggle-lang` is now a peer dependency.
- `@quri/ui`: `Tooltip` and `TextTooltip` wrap their portals with the `TailwindProvider` selector, like `Dropdown` already did.
- `squiggle-studio render` waits for relative values dashboards to finish computing.
