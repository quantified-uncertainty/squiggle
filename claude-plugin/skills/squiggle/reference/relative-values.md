# Relative values models

A relative values model estimates how valuable many items are **relative to each other**, rather than in absolute units. This is useful when there is no natural common unit (research projects, charities, features in a roadmap). The viewer compares every pair `(a, b)` and shows the ratio `value(a) / value(b)` as a distribution.

This page describes the convention used by `@quri/squiggle-relative-values` and Squiggle Studio's **Relative values** tab. Squiggle Hub's older relative values feature uses a different shape (see the end of this page).

## Shape

Any top-level variable (it doesn't need to be `export`ed) that holds a dict of one of these two forms is a relative values spec:

**`fn` form**: an explicit comparison function.

- `items` (required): a list of `{ id, name?, clusterId?, description? }` dicts, or plain id strings. `name` defaults to `id`. Ids must be unique.
- `fn` (required): a function `{|a, b| [distA, distB]}` that takes two item ids and returns the values of the two items, in a shared (arbitrary) unit, as distributions or numbers. The viewer computes the ratio itself.

**`values` form**: a dict from item id to value.

- `values` (required): a dict of distributions or numbers, with at least two entries. The comparison function is `{|a, b| [values[a], values[b]]}`.
- `items` (optional): if omitted, items are the keys of `values`. If given, every item id must be a key of `values`.

Optional fields for both forms:

- `title`: shown above the dashboard; defaults to the variable name.
- `clusters`: a list of `{ id, name?, color?, recommendedUnit? }` used to group and color items. Clusters referenced by items but not listed are created automatically, and `color` defaults to a built-in palette.
- `recommendedUnit`: an item id; the default reference item in the List view.

Returning both values from one call, instead of a single ratio, lets the model keep correlations: if both items depend on a shared uncertain quantity, computing them from the same samples makes the ratio tighter and more honest.

A dict that looks like a spec (has `fn` and `items`, or `values`) but breaks a rule above is still detected, and Studio shows the validation error (for example `recommendedUnit "c" is not an item id`).

## Views

Squiggle Studio shows a **Relative values** tab for files with at least one spec. The dashboard has three tabs:

- **List**: every item's value relative to a chosen reference item. Clicking a value opens charts for that pair.
- **Grid**: a matrix of all pairwise ratios.
- **Plot**: a similarity cluster map and a value-versus-uncertainty chart.

With several specs in one file, a picker chooses which one to show. To look at a dashboard yourself, render it to a PNG: `squiggle-studio render model.squiggle --view relative-values --tab grid --out grid.png` (add `--variable name` to pick a spec). See the `studio` skill for how to launch Studio.

All pairs are evaluated in the browser (n items means n² calls of `fn`), which takes roughly 0.35 ms per pair for sample-set models. Keep it under about 100 items.

## Example

```squiggle
// Relative values of a few charitable interventions, in arbitrary shared units.

@hide
values = {
  bednets: 50 to 200,
  cashTransfers: 10 to 40,
  deworming: mx([5 to 100, 0.5 to 300], [0.8, 0.2]),
  policyResearch: 1 to 1000,
}

relativeValues = {
  title: "Charitable interventions",
  clusters: [
    { id: "direct", name: "Direct delivery", color: "#2563eb" },
    { id: "research", name: "Research", color: "#db2777" },
  ],
  items: [
    { id: "bednets", name: "Bednet distribution", clusterId: "direct" },
    { id: "cashTransfers", name: "Cash transfers", clusterId: "direct" },
    { id: "deworming", name: "Deworming", clusterId: "direct" },
    { id: "policyResearch", name: "Policy research", clusterId: "research" },
  ],
  recommendedUnit: "cashTransfers",
  // Returns the values of a and b. Because both are computed from shared
  // samples, their ratio keeps any correlation between them.
  fn: {|a, b| [values[a], values[b]]},
}
```

The smallest spec:

```squiggle
fruit = { values: { apple: 1, banana: 0.5 to 2, mango: 2 to 6 } }
```

To check a pair from the CLI, add a temporary line at the end of the file, such as `check = relativeValues.fn("bednets", "cashTransfers")`, then run `squiggle run model.squiggle --json` and read the two summaries in `bindings.check`. Remove it afterward.

More examples are in `packages/relative-values/examples/` and `packages/studio/examples/relative-values/` in the Squiggle repo.

## Tips

- Put all values in one arbitrary unit (for example, "value of one bednet distribution = 1"). Only ratios matter.
- Use wide, right-skewed distributions; relative values often span orders of magnitude. `to` (lognormal) is usually a good default. For values that can be negative, use `normal({ p5: a, p95: b })`.
- Derive item values from shared inputs where possible, so `fn` captures their correlations.
- Squiggle Hub's older relative values definitions use a different shape: a separate definition with items and clusters, and a model whose `fn(id1, id2)` returns `[dist1, dist2]`. If the user is targeting Squiggle Hub, follow its format.
