# @quri/squiggle-relative-values

React components and helpers for **relative values** dashboards: compare a set of items pairwise, using a Squiggle model, and explore the results as a list, a grid, or a plot.

This package is extracted from [Squiggle Hub](https://squigglehub.org)'s relative values feature. It doesn't depend on Next.js, Prisma or any server code, so it can be used in any React app (e.g. a Vite app); see [Use in your app](#use-in-your-app).

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

Detection (`findRelativeValuesExports`, `looksLikeRelativeValuesSpec`) is deliberately looser than validation: a dict is a candidate if it has `fn` and `items` (whatever their types), or if it has a `values` dict and no `fn` (whatever its values). Detected dicts that fail validation are still returned, with an error message such as `values.kiwi must be a distribution or a number, got String`, so that the UI can explain what's wrong instead of silently ignoring the spec.

See [`examples/`](./examples) for complete models:

- [`quri.squiggle`](./examples/quri.squiggle): QURI projects, `fn` form, two clusters.
- [`health-interventions.squiggle`](./examples/health-interventions.squiggle): everyday health interventions, `values` form with items and clusters.
- [`minimal.squiggle`](./examples/minimal.squiggle): the smallest possible spec.

You can check that the examples run with `node packages/squiggle-lang/bin/squiggle.js run packages/relative-values/examples/quri.squiggle`.

## Use in your app

The dashboards are plain React components: they don't need Squiggle Hub, Next.js or a server. A typical setup is that model authors write `.squiggle` files (e.g. in Squiggle Studio), and your app either runs them in the browser (**live mode**) or loads precomputed JSON (**bundle mode**). See [`examples/host-app`](./examples/host-app) for a complete Vite app that does both.

### Install

```sh
npm install @quri/squiggle-relative-values @quri/squiggle-lang react react-dom
```

`@quri/squiggle-lang` is a peer dependency, so that your app and this package share one copy (Squiggle values are passed between them in live mode).

### Styles

```ts
import "@quri/squiggle-relative-values/styles.css";
import "./your-app.css"; // after, so that your class rules win in custom tabs
```

`styles.css` is self-contained (it includes the Tailwind classes used by this package, `@quri/ui` and `@quri/squiggle-components`, and `@quri/squiggle-components/common.css`) and scoped:

- Every rule only applies inside elements with the `squiggle-rv` class, which the dashboards render (and `RelativeValuesRoot`, for lower-level components). Dropdowns and tooltips, which render in portals, get their own wrapper. Nothing else on your page is restyled; keyframes are prefixed with `squiggle-rv-`.
- The other way around, your page's element rules (`body { font-family }`, `button { ... }`, `h1 { ... }`, ...) don't apply inside the dashboard: the wrapper doesn't inherit text styles, and element styles are reset to the browser's defaults inside it.
- That includes the content of custom tabs and `renderItemName`: style it with classes (or inline styles). Load `styles.css` before your own CSS, so that your class rules win over the dashboard's resets.
- Set `--squiggle-rv-font-family` on a parent element to change the font.
- Not covered: rules with ID selectors or `!important` (e.g. `#app button { ... }`) still apply inside, as do your rules for class names that the dashboard also uses (e.g. a global `.hidden`). Sizes are in `rem`, so they follow your root font size.

`full.css` is the older, unscoped stylesheet: it includes Tailwind's global preflight, which restyles the whole page, and needs `@quri/squiggle-components/common.css` too. It's kept for compatibility; prefer `styles.css`. If your app uses Tailwind, you can also generate the styles yourself, by adding this package's (and its dependencies') files to your `content` configuration, as described in the [squiggle-components README](../components/README.md), plus `./node_modules/@quri/squiggle-relative-values/dist/**/*.js`.

### Live mode

Run the model in the browser and render the specs that it defines:

```tsx
import { useEffect, useState } from "react";

import { run } from "@quri/squiggle-lang";
import {
  findRelativeValuesExports,
  type RelativeValuesExport,
  RelativeValuesSpecDashboard,
} from "@quri/squiggle-relative-values";

import modelCode from "./models/portfolio.squiggle?raw"; // Vite; or fetch it

export function Portfolio() {
  const [found, setFound] = useState<RelativeValuesExport[]>([]);

  useEffect(() => {
    run(modelCode).then((output) =>
      setFound(findRelativeValuesExports(output))
    );
  }, []);

  return found.map(({ name, spec }) =>
    spec.ok ? (
      <RelativeValuesSpecDashboard
        key={name}
        spec={spec.value}
        modelCode={modelCode} // optional: the sidebar's "Open in Playground" link
      />
    ) : (
      <div key={name}>{spec.value}</div>
    )
  );
}
```

Pairs are computed without blocking the page: the dashboard computes the pairs that the current view needs in chunks (yielding to the event loop between them), with a progress bar, and then the pairs for the other views in the background. In the example app, a model with 120 items (14,400 pairs) computes in about 3.5 seconds, and the page is never unresponsive for more than ~75ms (computing synchronously freezes it for 750ms for the list view alone). Pass `precompute={false}` to compute synchronously while rendering, as before.

Models with imports need a linker for `run`. The list sidebar's per-pair charts (ratio distribution, scatter plot, both distributions) don't re-run the model: they call the evaluator's comparison function and a fixed chart helper (`relativeValuesPairCharts`), so they also work for models with imports, numbers as values or a trailing result expression.

### Bundle mode

Precompute all pairs ahead of time, e.g. in CI or when a model changes, and ship them as JSON. Your app then doesn't run any Squiggle code.

```sh
npx squiggle-rv bundle models/portfolio.squiggle --out src/data/portfolio.bundle.json
```

Options: `--variable <name>` (if the file has several specs), `--seed <seed>` and `--sample-count <n>` (Squiggle's environment; the default seed makes bundles reproducible), `--precision <digits>` (round numbers to that many significant digits; a 150-item bundle goes from 3.7MB to 2.3MB with `--precision 4`, ~420KB gzipped) and `--quiet`. Relative imports (`import "./assumptions.squiggle" as a`) are resolved from the filesystem.

```tsx
import { RelativeValuesBundleDashboard } from "@quri/squiggle-relative-values";

import bundle from "./data/portfolio.bundle.json";

<RelativeValuesBundleDashboard bundle={bundle} />;
```

`bundle` can be any parsed JSON (an import, or `await response.json()`): it's validated, and validation errors are shown instead of the dashboard. In bundle mode, the list sidebar shows the summary numbers of a pair but no distribution charts.

The bundle format (`RelativeValuesBundle`, validated by `relativeValuesBundleSchema`):

```jsonc
{
  "version": 1,
  "definition": { "title": "...", "items": [...], "clusters": [...], "recommendedUnit": "sso" },
  "meta": {
    "generatedAt": "2026-10-19T14:09:41.895Z",
    "variableName": "portfolio",
    "seed": "default-seed",
    "sampleCount": 1000,
    "precision": 4, // if rounded
    "sourceHash": "sha256:...", // of the model and its imports, to detect stale bundles
    "generator": "squiggle-rv@0.1.0"
    // custom fields are allowed
  },
  // [id1, id2, value of id1 in terms of id2]; one line per pair
  "pairs": [
    ["sso", "auditLog", { "median": 2.1, "mean": 2.6, "min": 0.8, "max": 5.3, "uncertainty": 0.82 }],
    ["sso", "broken", { "error": "Dict property not found: broken" }]
  ]
}
```

Non-finite numbers are stored as the strings `"Infinity"`, `"-Infinity"` and `"NaN"`.

#### CSV

`relativeValuesBundleToCsv(bundle, options?)` (from either entry point) writes a bundle's pairs as CSV, for spreadsheets, pandas or an agent:

- **Wide** (default): the header row is an empty cell followed by the item ids; each following row starts with an item id and holds the `metric` of that item in terms of each column's item. `metric` is `"median"` (default), `"mean"`, `"min"` (p5), `"max"` (p95) or `"uncertainty"`. Failed comparisons are `ERR`.
- **Long** (`{ long: true }`): tidy rows `row,col,median,mean,min,max,uncertainty,error`, one per pair; a failed comparison has empty numbers and its error message.

```ts
import { relativeValuesBundleToCsv } from "@quri/squiggle-relative-values/core";

relativeValuesBundleToCsv(bundle);
// ,apple,banana,mango
// apple,1,0.98,0.29
// banana,1.02,1,0.29
// mango,3.46,3.39,1
relativeValuesBundleToCsv(bundle, { metric: "uncertainty" });
relativeValuesBundleToCsv(bundle, { long: true });
```

Items are in definition order; numbers are written as stored in the bundle (rounded if the bundle was created with `precision`). Squiggle Studio's `squiggle-studio rv <file> --format csv` prints the same CSV.

Without a dashboard, use the core API (also available from the React-free `@quri/squiggle-relative-values/core` entry point):

```ts
import {
  createRelativeValuesBundle,
  ModelEvaluator,
  parseRelativeValuesBundle,
  stringifyRelativeValuesBundle,
} from "@quri/squiggle-relative-values/core";

const parsed = parseRelativeValuesBundle(json); // result<RelativeValuesBundle, string>
if (!parsed.ok) throw new Error(parsed.value);
const evaluator = ModelEvaluator.fromBundle(parsed.value); // cache-only: evaluator.canCompute === false
evaluator.compare("sso", "auditLog"); // { ok: true, value: { median, mean, min, max, uncertainty } }

// Creating bundles from code (e.g. in a build script):
const bundle = await createRelativeValuesBundle({
  definition: spec.definition,
  evaluator: liveEvaluator,
  meta: { variableName: "portfolio" }, // seed and sampleCount come from the evaluator
  precision: 4, // optional
  onProgress: ({ done, total }) => console.log(done, total), // optional
});
fs.writeFileSync("bundle.json", stringifyRelativeValuesBundle(bundle));
```

### Customization

All dashboards (`RelativeValuesDashboard`, `RelativeValuesSpecDashboard`, `RelativeValuesBundleDashboard`) accept:

| Prop                                     | Description                                                                                                                                                                                    |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tabs`                                   | Tabs to show, in order. Built-in ids (`"list"`, `"grid"`, `"plot"`) and custom tabs `{ id, label, icon?, render(context) }`. Defaults to `["list", "grid", "plot"]`.                           |
| `tab`, `initialTab`, `onTabChange`       | Controlled or uncontrolled active tab (built-in or custom id); the default is the first tab.                                                                                                   |
| `showTabs`, `header`                     | Hide the tab buttons; replace the title on the left of the header row.                                                                                                                         |
| `onItemClick(item)`                      | Called when an item name is clicked (list rows, grid headers, list sidebar) or an item's dot is clicked in the plots. Without it, clicking a name in the list makes it the unit of comparison. |
| `renderItemName(item)`                   | Custom rendering of item names, e.g. a link to the item's page in your app.                                                                                                                    |
| `className`                              | Class of the outer (`.squiggle-rv`) element.                                                                                                                                                   |
| `height`                                 | E.g. `640`, or `"100%"` to fill a parent with a definite height; the content scrolls inside. By default, the dashboard grows with its content.                                                 |
| `clusterOverrides`                       | `{ [clusterId]: { name?, color? } }`, applied on top of the clusters from the spec or bundle. (In Squiggle, set them in the spec's `clusters`.)                                                |
| `precompute`                             | See [Live mode](#live-mode); defaults to `true`.                                                                                                                                               |
| `getPlaygroundUrl`, `linker`, `sourceId` | Live mode only: "Open in Playground" link (with `modelCode`). `linker` and `sourceId` are deprecated and unused.                                                                               |

A custom tab gets a `RelativeValuesTabContext`: `{ definition, evaluator, items, clusters }`, where `items` are filtered by the cluster filter and sorted by the sort settings (the grid's row settings; render `<ClusterFilter axis="rows" />` in your tab to let users change the filter), and `clusters` are keyed by id. All pairs are computed by the time a custom tab renders, so `evaluator.compare(id1, id2)` is cheap.

```tsx
<RelativeValuesBundleDashboard
  bundle={bundle}
  tabs={[
    "list",
    {
      id: "ranking",
      label: "Ranking",
      render: ({ items, evaluator, definition }) => (
        <RankingTable
          items={items}
          evaluator={evaluator}
          unit={definition.recommendedUnit}
        />
      ),
    },
    "grid",
  ]}
  onTabChange={(tab) => router.push(`?tab=${tab}`)} // tab: "list" | "grid" | "plot" | "ranking"
  renderItemName={(item) => (
    <a className="my-link" href={`/initiatives/${item.id}`}>
      {item.name}
    </a>
  )}
  clusterOverrides={{ research: { name: "Research & data", color: "#b7791f" } }}
  height="100%"
/>
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

`compare(id1, id2)` and `compareAll(ids)` are synchronous. `computeAll(ids, { signal, onProgress, sliceMs })` and `computePairs(pairs, options)` compute in chunks and yield to the event loop every `sliceMs` (default 12ms); they reject with an `AbortError` when `signal` is aborted. `isCached(pairs)` checks whether pairs are already computed.

### Server code

The main entry point includes React components (marked with `"use client"`). For server code (React Server Components, server actions, Node scripts), import the non-React parts from `@quri/squiggle-relative-values/core`: types and schemas, `ModelEvaluator`, caches, bundles and spec parsing helpers.

### Lower-level components

`RelativeValuesProvider` + `ListView` / `GridView` / `PlotView` let you render a single view, e.g. when tabs are controlled by your router. Wrap them in `<RelativeValuesRoot>` if you use `styles.css`, and use `useRelativeValuesComputation` to compute pairs without blocking (the dashboards do both). See `src/index.ts` for the full list of exports.

### Caches

`ModelEvaluator` consults a `RelativeValuesCache` before evaluating Squiggle code:

```ts
type RelativeValuesCache = {
  get(key: PairKey): RelativeValueResult | undefined;
  set(key: PairKey, result: RelativeValueResult): void;
};
```

Build keys with `makePairKey(id1, id2)` (and decode them with `parsePairKey`). The default is `InMemoryRelativeValuesCache`; Squiggle Hub prefills one with pairs stored in its database. `ModelEvaluator.fromCache(cache)` builds an evaluator that only reads from a cache (`fromBundle` uses it).

### Example app

[`examples/host-app`](./examples/host-app) is a Vite + React app that looks like a corporate portal, with its own fonts and global element styles. It embeds a live dashboard (`#/live`), a bundle dashboard with a custom tab and item links (`#/bundle`), and a 120-item model (`#/large`).

```sh
pnpm --filter @quri/relative-values-host-app-example dev          # dev server
pnpm --filter @quri/relative-values-host-app-example bundle       # regenerate src/data/portfolio.bundle.json
pnpm --filter @quri/relative-values-host-app-example build
pnpm --filter @quri/relative-values-host-app-example screenshots  # headless Chrome screenshots + style isolation checks
```

## Development

```sh
pnpm build   # tsc + css (full.css and the scoped styles.css)
pnpm test    # jest
pnpm dev     # storybook
```

`styles.css` is scoped by [`postcss-scope.cjs`](./postcss-scope.cjs), a small PostCSS plugin that runs after Tailwind.
