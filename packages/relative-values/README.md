# @quri/squiggle-relative-values

React components and helpers for **relative values** dashboards: compare a set of items pairwise, using a Squiggle model, and explore the results as a list, a grid, or a plot.

This package is extracted from [Squiggle Hub](https://squigglehub.org)'s relative values feature. It doesn't depend on Next.js, Prisma or any server code, so it can be used in any React app (e.g. a Vite app).

## Concepts

- An **item** is something you want to value: `{ id, name, clusterId?, description? }`.
- A **cluster** is a group of items: `{ id, name?, color, recommendedUnit? }`.
- A **definition** is `{ title, items, clusters, recommendedUnit? }`.
- A **comparison function** is a Squiggle function `fn(id1, id2) -> [dist1, dist2]`. The relative value of `id1` in terms of `id2` is `dist1 / dist2`.
- `ModelEvaluator` calls the comparison function for pairs of items and summarizes each ratio as `{ median, mean, min (p5), max (p95), uncertainty }` (uncertainty is `log10(p95 / p5)` of the absolute ratio). Results are memoized in a pluggable cache.

## The Squiggle convention

A Squiggle variable is a **relative values spec** if it's a dict of this shape:

```squiggle
dists = {
  apple: 1,
  banana: 0.5 to 2,
  mango: 2 to 6,
}

@name("Fruit")
fruit = {
  title: "Fruit", // optional; defaults to the variable name
  items: [
    { id: "apple", name: "Apple", clusterId: "common" },
    { id: "banana", name: "Banana", clusterId: "common", description: "Yellow" },
    { id: "mango", name: "Mango", clusterId: "tropical" },
  ],
  // optional; clusters referenced from items are created automatically
  clusters: [
    { id: "common", name: "Common", color: "#5D8CD3", recommendedUnit: "apple" },
    { id: "tropical", name: "Tropical", color: "#DB828C" },
  ],
  recommendedUnit: "apple", // optional; the default unit for the list view
  fn: {|a, b| [dists[a], dists[b]]},
}
```

Or, more simply, with `values` instead of `fn`. The comparison function is then `{|a, b| [values[a], values[b]]}`, and `items` can be omitted (items are derived from the keys of `values`):

```squiggle
fruit = {
  values: {
    apple: 1,
    banana: 0.5 to 2,
    mango: 2 to 6,
  },
}
```

Rules:

- `fn` must be a function of two item ids that returns a pair of distributions (or numbers).
- `values` must be a dict of distributions or numbers. If `items` is given too, every item id must be a key of `values`.
- `items` is a list of `{ id, name?, clusterId?, description? }` dicts, or plain id strings. `name` defaults to `id`. Item ids must be unique.
- `clusters` is a list of `{ id, name?, color?, recommendedUnit? }`; `color` defaults to a built-in palette.
- `recommendedUnit` (both top-level and per-cluster) must be an item id.
- The variable doesn't need to be `export`ed: all top-level bindings are checked.

Detection (`findRelativeValuesExports`, `looksLikeRelativeValuesSpec`) treats a dict as a spec if it has `fn` (a function) and `items` (a list), or if it has `values` (and no `fn`) with at least two entries that are all distributions or numbers. Detected dicts that fail validation are still returned, with an error message, so that the UI can explain what's wrong.

See [`examples/`](./examples) for complete models:

- [`quri.squiggle`](./examples/quri.squiggle): QURI projects, `fn` form, two clusters.
- [`health-interventions.squiggle`](./examples/health-interventions.squiggle): everyday health interventions, `values` form with items and clusters.
- [`minimal.squiggle`](./examples/minimal.squiggle): the smallest possible spec.

You can check that the examples run with `node packages/squiggle-lang/bin/squiggle.js run packages/relative-values/examples/quri.squiggle`.

## Usage

### Styles

If you use Tailwind, add this package's (and its dependencies') files to your `content` configuration, as described in the [squiggle-components README](../components/README.md), plus `./node_modules/@quri/squiggle-relative-values/dist/**/*.js`.

Otherwise, import the bundled CSS:

```ts
import "@quri/squiggle-components/common.css";
import "@quri/squiggle-relative-values/full.css";
```

(`full.css` already includes the Tailwind classes used by `@quri/ui` and `@quri/squiggle-components`, so you don't need `@quri/squiggle-components/full.css`.)

### From a Squiggle run

```tsx
import { useEffect, useState } from "react";

import { run } from "@quri/squiggle-lang";
import {
  findRelativeValuesExports,
  RelativeValuesExport,
  RelativeValuesSpecDashboard,
} from "@quri/squiggle-relative-values";

import "@quri/squiggle-components/common.css";
import "@quri/squiggle-relative-values/full.css";

export function App({ code }: { code: string }) {
  const [found, setFound] = useState<RelativeValuesExport[]>([]);

  useEffect(() => {
    run(code).then((output) => setFound(findRelativeValuesExports(output)));
  }, [code]);

  return found.map(({ name, spec }) =>
    spec.ok ? (
      <RelativeValuesSpecDashboard
        key={name}
        spec={spec.value}
        modelCode={code} // optional, enables per-pair charts in the list sidebar
        initialTab="list"
        // optional: resolve imports in the per-pair charts (re-runs modelCode)
        // linker={linker} sourceId="models/main.squiggle"
        onTabChange={(tab) => console.log(tab)}
      />
    ) : (
      <div key={name}>{spec.value}</div>
    )
  );
}
```

### With an explicit evaluator

```tsx
import {
  InMemoryRelativeValuesCache,
  ModelEvaluator,
  RelativeValuesDashboard,
} from "@quri/squiggle-relative-values";

const evaluator = await ModelEvaluator.create(code, "fn", {
  cache: new InMemoryRelativeValuesCache(), // or your own { get, set }
});
if (!evaluator.ok) throw new Error(evaluator.value);

<RelativeValuesDashboard
  definition={{ title: "My items", items, clusters, recommendedUnit: null }}
  evaluator={evaluator.value}
/>;
```

`ModelEvaluator.create(code, variableName)` accepts either a comparison function (the classic Squiggle Hub convention) or a spec dict.

### Server code

The main entry point includes React components (marked with `"use client"`). For server code (React Server Components, server actions, Node scripts), import the non-React parts from `@quri/squiggle-relative-values/core`: types and schemas, `ModelEvaluator`, caches and spec parsing helpers.

### Lower-level components

`RelativeValuesProvider` + `ListView` / `GridView` / `PlotView` let you render a single view, e.g. when tabs are controlled by your router. See `src/index.ts` for the full list of exports.

### Caches

`ModelEvaluator` consults a `RelativeValuesCache` before evaluating Squiggle code:

```ts
type RelativeValuesCache = {
  get(key: PairKey): RelativeValueResult | undefined;
  set(key: PairKey, result: RelativeValueResult): void;
};
```

Build keys with `makePairKey(id1, id2)` (and decode them with `parsePairKey`). The default is `InMemoryRelativeValuesCache`; Squiggle Hub prefills one with pairs stored in its database.

## Development

```sh
pnpm build   # tsc + css
pnpm test    # jest
pnpm dev     # storybook
```
