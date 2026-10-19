# Relative values models

> Experimental. The conventions on this page are being built for Squiggle Studio and are subject to change. If a tool rejects this shape, check its own docs or error messages and follow them.

A relative values model estimates how valuable many items are **relative to each other**, rather than in absolute units. This is useful when there is no natural common unit (research projects, charities, features in a roadmap). The viewer compares every pair `(a, b)` and shows the ratio `value(a) / value(b)` as a distribution.

## Shape

The file exports a dict with:

- `items`: a list of `{ id, name, clusterId?, description? }`. `id` is the string passed to `fn`.
- `clusters` (optional): a list of `{ id, name, color }` used to group and color items.
- `fn`: a function `fn(a, b)` that takes two item ids and returns `[distA, distB]`, the values of the two items in a shared (arbitrary) unit. The viewer computes the ratio itself.

Returning both values from one call, instead of a single ratio, lets the model keep correlations: if both items depend on a shared uncertain quantity, computing them from the same samples makes the ratio tighter and more honest.

## Views

Squiggle Studio (and Squiggle Hub) render these models with three tabs:

- **List**: every item's value relative to a chosen reference item.
- **Grid**: a matrix of all pairwise ratios.
- **Plot**: a chart of the items' relative values and their uncertainty.

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
  // Returns the values of a and b. Because both are computed from shared
  // samples, their ratio keeps any correlation between them.
  fn: {|a, b| [values[a], values[b]]},
}
```

To check a pair from the CLI, add a temporary line at the end of the file, such as `check = relativeValues.fn("bednets", "cashTransfers")`, then run `squiggle run --json` and read the two summaries. Remove it afterward.

## Tips

- Put all values in one arbitrary unit (for example, "value of one bednet distribution = 1"). Only ratios matter.
- Use wide, right-skewed distributions; relative values often span orders of magnitude. `to` (lognormal) is usually a good default.
- Derive item values from shared inputs where possible, so `fn` captures their correlations.
- Squiggle Hub's older relative values definitions use a different shape: a separate definition with items and clusters, and a model whose `fn(id1, id2)` returns a dict with a `value` field. Follow whatever format the target tool expects.
