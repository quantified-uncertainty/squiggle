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

Detection (`findRelativeValuesExports`, `looksLikeRelativeValuesSpec`) treats a dict as a spec if it has `fn` (a function) and `items` (a list), or if it has `values` (and no `fn`) with at least two entries that are all distributions or numbers. Detected dicts that fail validation are still returned, with an error message, so that the UI can explain what's wrong.

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
        modelCode={modelCode} // optional: per-pair charts in the list sidebar
      />
    ) : (
      <div key={name}>{spec.value}</div>
    )
  );
}
```

Pairs are computed without blocking the page: the dashboard computes the pairs that the current view needs in chunks (yielding to the event loop between them), with a progress bar, and then the pairs for the other views in the background. In the example app, a model with 120 items (14,400 pairs) computes in about 3.5 seconds, and the page is never unresponsive for more than ~75ms (computing synchronously freezes it for 750ms for the list view alone). Pass `precompute={false}` to compute synchronously while rendering, as before.

Models with imports need a linker, both for `run` and, for the per-pair charts, for the dashboard (`linker` and `sourceId` props). Bundle mode avoids this.

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

| Prop                                                                                     | Description                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tabs`                                                                                   | Tabs to show, in order. Built-in ids (`"list"`, `"grid"`, `"plot"`) and custom tabs `{ id, label, icon?, render(context) }`. Defaults to `["list", "grid", "plot"]`.                           |
| `tab`, `initialTab`, `onTabChange`                                                       | Controlled or uncontrolled active tab (built-in or custom id); the default is the first tab.                                                                                                   |
| `showTabs`, `header`                                                                     | Hide the tab buttons; replace the title on the left of the header row.                                                                                                                         |
| `onItemClick(item)`                                                                      | Called when an item name is clicked (list rows, grid headers, list sidebar) or an item's dot is clicked in the plots. Without it, clicking a name in the list makes it the unit of comparison. |
| `renderItemName(item)`                                                                   | Custom rendering of item names, e.g. a link to the item's page in your app.                                                                                                                    |
| `className`                                                                              | Class of the outer (`.squiggle-rv`) element.                                                                                                                                                   |
| `height`                                                                                 | E.g. `640`, or `"100%"` to fill a parent with a definite height; the content scrolls inside. By default, the dashboard grows with its content.                                                 |
| `clusterOverrides`                                                                       | `{ [clusterId]: { name?, color? } }`, applied on top of the clusters from the spec or bundle. (In Squiggle, set them in the spec's `clusters`.)                                                |
| `precompute`                                                                             | See [Live mode](#live-mode); defaults to `true`. `"visible"` computes what the views show, without the background pass.                                                                        |
| `getPlaygroundUrl`, `linker`, `sourceId`                                                 | Live mode only: "Open in Playground" link and imports for the per-pair charts.                                                                                                                 |
| `state`, `defaultState`, `onStateChange`, `locked`, `apiRef`                             | Control what is shown: view, unit, filters, search, sort, limit, grid columns and selection. See [Customizing in your app](#customizing-in-your-app).                                          |
| `scope`, `sorts`                                                                         | Restrict the items (ids, clusters, a predicate); register custom sorts.                                                                                                                        |
| `controls`, `components`, `labels`, `format`, `display`, `themeClassName`, `onPairClick` | Hide or replace built-in pieces, translate strings, format numbers, cell/plot/density options, theming.                                                                                        |

A custom tab gets a `RelativeValuesTabContext`, the same controller as [`useRelativeValues()`](#s8-custom-views-from-headless-data): `definition`, `evaluator`, `clusters` (keyed by id), `items` (the items shown: scope, filters, search, sort and limit applied), `rows` (the items with their value in units of `unit`), `unit`, `state`, `actions`, `format`, `labels` and more. By default all pairs in scope are computed before a custom tab renders (`requires: "all"`), so `evaluator.compare(id1, id2)` is cheap; `requires: "unit"` only waits for each item's value in units of `unit`.

```tsx
<RelativeValuesBundleDashboard
  bundle={bundle}
  tabs={[
    "list",
    {
      id: "ranking",
      label: "Ranking",
      requires: "unit",
      render: ({ rows, unit }) => <RankingTable rows={rows} unit={unit} />,
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

The main entry point includes React components (marked with `"use client"`). For server code (React Server Components, server actions, Node scripts), import the non-React parts from `@quri/squiggle-relative-values/core`: types and schemas, `ModelEvaluator`, caches, bundles, spec parsing helpers, and the [state, pipeline and URL helpers](#reference) (`selectRelativeValues`, `relativeValuesStateFromSearchParams`, ...).

### Lower-level components

`RelativeValuesSingleView` renders one view without a header or tab bar. `RelativeValuesProvider` + `ListView` / `GridView` / `PlotView`, the primitives and `useRelativeValues()` let you build your own layout; see [Customizing in your app](#customizing-in-your-app). Wrap the pieces in `<RelativeValuesRoot>` if you use `styles.css`. See `src/index.ts` for the full list of exports.

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

[`examples/host-app`](./examples/host-app) is a Vite + React app that looks like a corporate portal, with its own fonts and global element styles. It embeds a live dashboard (`#/live`), a bundle dashboard with a custom tab and item links (`#/bundle`), a 120-item model (`#/large`), and one page per [customization scenario](#customizing-in-your-app) (`#/scenarios`, `#/s1` ... `#/s10`), each with its code.

```sh
pnpm --filter @quri/relative-values-host-app-example dev          # dev server
pnpm --filter @quri/relative-values-host-app-example bundle       # regenerate src/data/portfolio.bundle.json
pnpm --filter @quri/relative-values-host-app-example build
pnpm --filter @quri/relative-values-host-app-example screenshots  # screenshots + checks (screenshots/checks.json)
```

## Customizing in your app

A host app usually wants to change many settings: show one view instead of the tabs, restrict or limit the items, fix the unit, hide some controls, keep the settings in its URL, or draw its own views on the same data. Everything below works the same for bundles, specs and explicit evaluators. Each scenario has a page in the [example app](#example-app) (`#/s1` ... `#/s10`), with its code and screenshots.

There are three kinds of input:

| Kind             | What it is                                                                                                                                                   | Props                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| **State**        | _What_ is shown and selected: view, unit, filters, search, sort, limit, grid columns, grid mode, selection. Plain JSON (it can go in a URL or localStorage). | `state` (controlled keys), `defaultState`, `onStateChange`, `locked`, `apiRef`           |
| **Scope, sorts** | The host's definition of the items (it may contain functions), and custom sorts.                                                                             | `scope`, `sorts`                                                                         |
| **Presentation** | _How_ it looks: which controls exist, replacement components, strings, number format, cell and plot options, density, theme.                                 | `controls`, `components`, `labels`, `format`, `display`, `themeClassName`, `onPairClick` |

Components, from the most packaged to the least:

| Component                                                                                 | Use                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RelativeValuesDashboard`, `RelativeValuesSpecDashboard`, `RelativeValuesBundleDashboard` | Header, tab bar and views.                                                                                                                                                                               |
| `RelativeValuesSingleView`                                                                | One view (`"list"`, `"grid"`, `"plot"` or a custom view), with no header or tab bar. Standalone with a source (`bundle`, `spec`, or `definition` + `evaluator`); otherwise it uses the nearest provider. |
| `RelativeValuesProvider` + views, primitives and `useRelativeValues()`                    | Your own layout: several views sharing one state, controls in your chrome, fully custom views. The provider renders no DOM.                                                                              |
| `selectRelativeValues` and the state and URL helpers (from `/core`)                       | React-free: server components, Node, tests, exports.                                                                                                                                                     |

Quick reference:

| The host wants to…                     | Use                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| show one view, no chrome               | `<RelativeValuesSingleView bundle={b} view="grid" controls={false} />`                                             |
| restrict to items, clusters, a test    | `scope={{ ids \| clusters \| exclude \| where }}`                                                                  |
| a filter or search the user can change | `defaultState={{ clusters, search, ids }}` (or controlled `state`)                                                 |
| the top N by value in units of X       | `state={{ unit: "x", sort: { mode: "median", desc: true }, limit: N }}`                                            |
| fix a setting                          | `state={{ … }}` without `onStateChange`, or list the keys in `locked`                                              |
| hide a control                         | `controls={{ list: { search: false } }}`                                                                           |
| replace a control in place             | `components={{ TabBar \| Toolbar \| Progress \| Cell \| PairDetails \| Empty \| Error }}` (each gets `Default`)    |
| move a control into your chrome        | hide it, then place `RelativeValuesSearchBox` etc. under the provider, or call `useRelativeValues().actions`       |
| sync with the URL                      | `relativeValuesStateFromSearchParams` / `relativeValuesStateToSearchParams` with `state` and `onStateChange`       |
| a custom view                          | a custom tab or single view (`render(ctx)` with `ctx.rows`), or `useRelativeValues({ requires })` under a provider |

### S1: one view, no chrome

```tsx
<RelativeValuesSingleView bundle={bundle} view="grid" controls={false} />
<RelativeValuesSingleView spec={spec} modelCode={code} view="list" /> // keeps its toolbar
<RelativeValuesSingleView
  bundle={bundle}
  view={{
    id: "ranking",
    label: "Ranking",
    requires: "unit", // only item × unit pairs
    render: (ctx) => <Ranking rows={ctx.rows} unit={ctx.unit} />,
  }}
  state={{ unit: "sso", sort: { mode: "median", desc: true } }} // fixed
/>
<RelativeValuesBundleDashboard bundle={bundle} tabs={["plot"]} controls={{ header: false, tabs: false }} />
```

A single view never renders a header or a tab bar, and ignores `state.view`. `controls={false}` also removes the toolbars, unit pickers, the sidebar and the plot's cluster panel; item clicks (`onItemClick`) and cell clicks (`onPairClick`, selection) keep working.

### S2: subsets and top N

```tsx
// A fixed universe: the user can't widen it; it bounds the views, menus and computation.
<RelativeValuesBundleDashboard bundle={bundle} scope={{ ids: teamIds }} />
<RelativeValuesBundleDashboard bundle={bundle} scope={{ clusters: ["platform", null], exclude: ["legacy"] }} />
<RelativeValuesBundleDashboard bundle={bundle} scope={{ where: (item, cluster) => owners[item.id] === "Data team" }} />

// Filters the user can change (initial values):
<RelativeValuesBundleDashboard bundle={bundle} defaultState={{ clusters: ["research"], search: "audit" }} />

// The top 10 by value in units of SSO, as one ranked table:
<RelativeValuesSingleView bundle={bundle} view="list"
  state={{ unit: "sso", sort: { mode: "median", desc: true }, limit: 10 }}
  display={{ list: { groupByCluster: false } }} />

// The 10 most valuable, which the user may re-sort (e.g. by name) without changing which 10:
<RelativeValuesSingleView bundle={bundle} view="list"
  state={{ unit: "sso", limit: 10, limitBy: { mode: "median", desc: true } }}
  onStateChange={…} locked={["unit", "limit", "limitBy"]}
  display={{ list: { groupByCluster: false } }} />
```

`scope.ids` sets the default order; `null` in `scope.clusters` stands for items without a cluster. `scope.where` runs on every render and needn't be memoized (its result is compared by ids); to toggle a predicate, pass a different `scope`. `state.ids` is an allowlist the user can't see; if none of its ids exist, nothing is shown (the `Empty` slot), not everything.

### S3: fixed or controlled unit and sort

```tsx
// Fixed: controlled without onStateChange, so locked; the unit pickers and "Sort by" are hidden.
<RelativeValuesBundleDashboard
  bundle={bundle}
  state={{ unit: "sso", sort: { mode: "name", desc: false } }}
/>;

// Controlled and user-changeable, with a host-registered sort:
const [unit, setUnit] = useState<string | null>("sso");
const revenue = useRevenue(); // host data, e.g. loaded after the dashboard
<RelativeValuesBundleDashboard
  bundle={bundle}
  state={{ unit }}
  onStateChange={(next, change) =>
    change.keys.includes("unit") && setUnit(next.unit)
  }
  sorts={{
    revenue: {
      label: "Revenue",
      compare: (a, b) =>
        (revenue?.[a.item.id] ?? 0) - (revenue?.[b.item.id] ?? 0),
    },
  }}
  controls={{
    sortMenu: { sortOptions: ["median", "uncertainty", "name", "revenue"] },
  }}
/>;
```

Sort modes: `default` (the default order: `state.ids`, else `scope.ids`, else the definition), `median` ("Value"), `uncertainty`, `similarity`, `name` (locale-aware, `format.locale`), `cluster`, and the ids of `sorts`. Ties keep the default order in both directions, and missing values (not computed yet, or errors) sort last in both directions. Custom sort ids can't start with `-`.

A custom sort's `compare` may close over host data: when the `compare` of a sort in use (by `sort`, `limitBy` or `columns`) is a new function, the order is recomputed, so the list re-sorts when the data arrives. Functions are compared by identity, so an inline `compare` re-sorts on every render of your component; wrap it in `useCallback` if that component re-renders often.

In grouped lists (the default), the compass icons and the column-header dropdown pick the unit of one table (`clusterUnits`); in a flat list (`display.list.groupByCluster: false`) and in `RelativeValuesUnitPicker` they set the global `unit`.

### S4: hide or replace controls

```tsx
<RelativeValuesBundleDashboard
  bundle={bundle}
  controls={{
    header: false,
    progress: false,
    list: { settings: false, sidebar: false },
    grid: { columnSettings: false, clusterDiagram: false, modeControls: false },
    plot: { clusterFilter: false },
    sortMenu: { sortOptions: ["default", "median", "name"] },
  }}
  components={{
    TabBar: ({ tabs, active, onChange }) => <MySegmented value={active} onChange={onChange} options={tabs} />,
    Toolbar: ({ view, children }) => <div className="row">{children}<ExportButton view={view} /></div>,
    Progress: ({ variant, progress, Default }) => (variant === "compact" ? <Default variant={variant} progress={progress} /> : <MySpinner />),
    PairDetails: ({ Default, ...props }) => <MyDrawer title={`${props.numerator.name} / ${props.denominator.name}`} onClose={props.close}><Default {...props} /></MyDrawer>,
    Empty: ({ reason }) => <p>{reason === "scope" ? "Nothing here" : "No matches"}</p>,
    Error: ({ error }) => <MyAlert>{error}</MyAlert>,
  }}
/>

// …or move controls into your layout. Wrap each piece in RelativeValuesRoot, so that
// your markup between them keeps your styles.
<RelativeValuesProvider bundle={bundle} precompute>
  <header className="my-toolbar">
    <h2>Portfolio</h2>
    <RelativeValuesRoot><RelativeValuesSearchBox placeholder="Search initiatives" /></RelativeValuesRoot>
    <RelativeValuesRoot><RelativeValuesUnitPicker /></RelativeValuesRoot>
    <RelativeValuesRoot><RelativeValuesSortMenu axis="rows" sections={["sort"]} /></RelativeValuesRoot>
  </header>
  {/* Your search box is the only one: no "Search: x ×" chip either. */}
  <RelativeValuesSingleView view="list" controls={{ list: { toolbar: false, sidebar: false }, searchChip: false }} />
  <aside><RelativeValuesRoot><RelativeValuesPairDetails /></RelativeValuesRoot></aside>
</RelativeValuesProvider>
```

`controls={false}` turns everything off, `true` (the default) everything on, and an object is merged over the defaults (a single view under a provider merges its `controls` over the provider's).

Slots get the built-in implementation as `Default`. They can be written inline, as above: a new function with the same code (as an inline slot is on every render) re-renders the slot instead of remounting it, so the toolbar's search box keeps its focus while you type, and the live sidebar's charts don't re-run. A slot with different code is remounted. The `Toolbar` slot gets the `view` (`"list"`, `"grid"` or `"plot"`) and the built-in toolbar as `children`; it's rendered in every view whose `toolbar` control is on (`controls.list.toolbar`, `grid.toolbar`, `plot.toolbar`), also when no built-in control is left in it (the plot's built-in toolbar is empty), so an Export button can go in every view.

| Control                        | Hide with                                                                                                                           | Replace or place with                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| title                          | `controls.header`, `header={null}`                                                                                                  | `header` (a node)                               |
| tab bar                        | `controls.tabs` (alias `showTabs`)                                                                                                  | `TabBar` slot                                   |
| Table / Row / Column Settings  | `controls.list.settings`, `grid.rowSettings`, `grid.columnSettings`                                                                 | `RelativeValuesSortMenu`                        |
| their sections and sort modes  | `controls.sortMenu.clusters`, `.sort`, `.sortOptions` (`[]` hides "Sort by")                                                        | `RelativeValuesSortMenu sections sortOptions`   |
| cluster filter                 | `controls.sortMenu.clusters`, `controls.plot.clusterFilter`                                                                         | `ClusterFilter`                                 |
| search box                     | `controls.list.search`, `list.toolbar` (an active search then shows as a "Search: x ×" chip; `controls.searchChip: false` hides it) | `RelativeValuesSearchBox`                       |
| unit pickers (compass, header) | `controls.list.unitPicker`                                                                                                          | `RelativeValuesUnitPicker`                      |
| list sidebar                   | `controls.list.sidebar`                                                                                                             | `PairDetails` slot, `RelativeValuesPairDetails` |
| cluster diagram                | `controls.grid.clusterDiagram`                                                                                                      | `RelativeValuesClusterDiagram`                  |
| grid mode icons                | `controls.grid.modeControls`                                                                                                        | `RelativeValuesGridModeControls`                |
| toolbars                       | `controls.list.toolbar`, `grid.toolbar`, `plot.toolbar`                                                                             | `Toolbar` slot                                  |
| progress                       | `controls.progress` (the compact one)                                                                                               | `Progress` slot, `RelativeValuesProgressBar`    |
| value cells                    |                                                                                                                                     | `Cell` slot                                     |

Not replaceable: the drawing inside the canvas plots, and the Squiggle charts in the live-mode sidebar.

### S5: host state, URL, preferences, linking, imperative handle

```tsx
const URL_KEYS: RelativeValuesStateKey[] = ["view", "unit", "clusters", "search", "sort", "limit", "gridMode", "selectedPair"];

function PortfolioRoute() {
  const [params, setParams] = useSearchParams(); // any router
  const state = useMemo(() => relativeValuesStateFromSearchParams(params, { keys: URL_KEYS }), [params]);
  const api = useRef<RelativeValuesHandle>(null);
  return (
    <>
      <button onClick={() => api.current?.setState({ view: "list", selectedPair: ["sso", "auditLog"] })}>Compare</button>
      <RelativeValuesBundleDashboard
        bundle={bundle}
        apiRef={api}
        state={state}
        onStateChange={(next, change) =>
          setParams(relativeValuesStateToSearchParams(next, { keys: URL_KEYS, base: params }), {
            replace: change.reason === "search" || change.reason === "selection",
          })
        }
        onItemClick={(item) => openInspector(item)}
        onPairClick={({ numerator, denominator }) => track(numerator.id, denominator.id)}
      />
    </>
  );
}

// Custom tabs, or a first tab other than "list": pass the tab ids to both helpers (the
// first one is the default view, which the URL omits).
const views = ["ranking", "list", "grid"] as const;
const state = relativeValuesStateFromSearchParams(params, { keys: URL_KEYS, views });
// …and in onStateChange:
setParams(relativeValuesStateToSearchParams(next, { keys: URL_KEYS, views, base: params }));

// Saved preferences: uncontrolled, with saved defaults.
const saved = parseRelativeValuesState(JSON.parse(localStorage.getItem(key) ?? "null")).state;
<RelativeValuesBundleDashboard bundle={bundle} defaultState={saved}
  onStateChange={(next) => localStorage.setItem(key, JSON.stringify(pickRelativeValuesState(next, ["unit", "sort", "gridMode"])))} />

// Linked dashboards share some keys through the host…
const [link, setLink] = useState<RelativeValuesStateInput>({ unit: null, clusters: null, search: "" });
const onLink = (next: RelativeValuesState<string>) => setLink({ unit: next.unit, clusters: next.clusters, search: next.search });
// A flat list: its compass icons set `unit` (in a grouped list they set `clusterUnits`, per table).
<RelativeValuesSingleView bundle={bundle} view="list" state={link} onStateChange={onLink}
  display={{ list: { groupByCluster: false } }} />
<RelativeValuesSingleView bundle={bundle} view="plot" state={link} onStateChange={onLink} />
// …or share everything with one provider (S10).
```

`onStateChange(next, change)` gets the whole new state and `change`: `reason` (`"view"`, `"unit"`, `"filter"`, `"search"`, `"sort"`, `"limit"`, `"columns"`, `"gridMode"`, `"selection"`, `"set"`, `"reset"`), the `keys` that changed, `axis` (`"rows"` or `"columns"`, for axis changes), `source` (`"user"` for built-in UI, `"api"` for `actions`, `apiRef` and host code) and the `previous` state. It's called synchronously in the event handler, never while rendering. Custom tab ids are typed: with `tabs={["list", { id: "ranking", … }]}`, `next.view` is `"list" | "grid" | "plot" | "ranking"`; pass `views` to the URL helpers to validate them (`relativeValuesStateFromSearchParams(params, { views: ["list", "ranking"] as const })`).

Several changes in one event build on each other: after `setUnit("sso")` and `setSort(…)` in one click handler, the second `next` has both changes, also when both keys are controlled and the host hasn't passed them back yet. A proposal that the host doesn't take ends with the event.

The search box shows what you type at once and filters the views in a transition. With a controlled `search`, update it in `onStateChange` (synchronously, or within a microtask, as routers do); once the transition has rendered, the box shows the effective value again, so a rejected change disappears. To debounce, debounce the URL write, not the state.

`apiRef` (a prop, not `ref`, so that it works with generic components and React 18): `getState()`, `setState(input | (state) => input)`, `reset(keys?)` (back to `defaultState`, then the defaults), `getData()`, `scrollTo({ item } | { pair })` and `whenReady()` (resolves once the mounted views' pairs are computed; the root then has `data-rv-ready`). `useRef<RelativeValuesHandle>(null)` works for dashboards, single views and `RelativeValuesProvider` (whose views are `string`). `getData()` returns the pipeline's result (`items`, `rows`, `columns`) in the pipeline's order, which is what a flat list shows and what custom views and headless code get; the grid and grouped lists re-order it for display (see [the pipeline](#the-pipeline)).

To keep two dashboards' state in one URL, give them different `prefix`es (default `"rv."`).

### S6: grid

```tsx
// These four items as rows and columns, in this order; a half matrix; values only.
<RelativeValuesSingleView bundle={bundle} view="grid"
  scope={{ ids: ["sso", "auditLog", "partnerApi", "dbMigration"] }}
  defaultState={{ columns: "rows", gridMode: "half" }}
  display={{ grid: { cell: "value", heatmap: false, cellWidth: 110 } }} />

// Rows: one cluster. Columns: the 5 most valuable items, which Column Settings re-sorts
// without changing which 5 (limitBy). Cluster bands.
<RelativeValuesSingleView bundle={bundle} view="grid"
  defaultState={{ clusters: ["research"], sort: { mode: "cluster" },
                  columns: { limit: 5, limitBy: { mode: "median", desc: true },
                             sort: { mode: "median", desc: true } } }}
  display={{ grid: { cell: "full", groupByCluster: true } }} />

// Explicit rows and columns:
<RelativeValuesSingleView bundle={bundle} view="grid"
  defaultState={{ ids: ["usageBilling", "partnerApi"], columns: { ids: ["sso", "ciSpeedup"] } }} />

// The cluster-level matrix as the main view:
<RelativeValuesProvider bundle={bundle}>
  <RelativeValuesRoot><RelativeValuesClusterDiagram /></RelativeValuesRoot>
</RelativeValuesProvider>
```

`columns: "rows"` mirrors the rows (Column Settings is then hidden, and half mode hides the diagonal and above, by display order); otherwise columns are an independent axis with their own `ids`, `clusters`, `sort`, `limit` and `limitBy`, which work as the rows' (search doesn't apply to columns). Without `limitBy`, `limit` keeps the first N by `columns.sort`, so re-sorting the columns changes which N. Cell display: `"value"` (median), `"valueAndUncertainty"` (median ± uncertainty, the default) or `"full"` (with the 90% interval). Cell clicks set `selectedPair` (highlighting the cell) and call `onPairClick`.

### S7: plot

```tsx
<RelativeValuesSingleView
  bundle={bundle}
  view="plot"
  state={{ unit: "sso" }}
  controls={{ plot: { clusterFilter: false } }}
  display={{
    plot: {
      plots: ["valueUncertainty"],
      height: 320,
      titles: false,
      valueUncertainty: { reference: "unit", xScale: "log", yScale: "linear" },
    },
  }}
/>
```

`plots`: `"similarity"` and/or `"valueUncertainty"`, in the order shown (`[]` shows no plot). The value / uncertainty plot's `reference` is `"auto"` (the unit if set, else the recommended unit, else the average over all items in scope), `"unit"` or `"average"`. A log scale leaves out the points it can't show: with `yScale: "log"`, the unit against itself (no uncertainty); with `xScale: "log"`, zero medians. The dots follow scope, filters, search and limit; `selectedItem` rings a dot, and clicking a dot selects it (and calls `onItemClick`). New kinds of plots are custom views (S8).

### S8: custom views from headless data

```tsx
const TopInitiatives: FC<{ count: number }> = ({ count }) => {
  const rv = useRelativeValues({
    requires: "unit",
    overrides: { sort: { mode: "median", desc: true }, limit: count }, // this consumer only
  });
  if (rv.status === "loading") return <Spinner />;
  if (rv.status === "error") return <Alert>{rv.error}</Alert>;
  return (
    <ol aria-busy={rv.status === "computing"}>
      {rv.rows.map(({ item, value }) => (
        <li key={item.id} onClick={() => rv.actions.selectItem(item.id)}>
          {item.name}: {value ? rv.format.value(value) : "…"} × {rv.unit?.name}
        </li>
      ))}
    </ol>
  );
};

<RelativeValuesProvider bundle={bundle} defaultState={{ unit: "sso" }}>
  <TopInitiatives count={5} />
</RelativeValuesProvider>

// Live: "visible" computes only what the widget needs (items × unit). With
// `precompute` (true), every pair in scope follows in the background.
<RelativeValuesProvider spec={spec} modelCode={code} precompute="visible">
  <TopInitiatives count={5} />
  <RelativeValuesRoot><RelativeValuesProgressBar variant="compact" /></RelativeValuesRoot>
</RelativeValuesProvider>

// Server (RSC or Node), bundle mode, from "/core":
const parsed = parseRelativeValuesBundle(json);
if (!parsed.ok) throw new Error(parsed.value);
const { rows } = selectRelativeValues({
  definition: parsed.value.definition,
  evaluator: ModelEvaluator.fromBundle(parsed.value),
  state: { unit: "sso", sort: { mode: "median", desc: true }, limit: 10 },
  compute: "cached",
});
```

The controller (`useRelativeValues()`, and the context of custom tabs and views) has: `status` (`"loading"` while a spec's evaluator is created, `"computing"` until this consumer's pairs are computed, `"ready"`, or `"error"` with `error`), `items`, `rows` (`{ item, cluster, rank, unit, result, value }`, the value in units of `unit`; `value` is undefined until computed), `filtered` (the items before `limit`), `universe` (the items in scope), `columns`, `unit`, `recommendedUnit`, `tableUnit(clusterId)`, `clusters`, `state`, `actions` (`setView`, `setUnit`, `setSearch`, `setClusters`, `toggleCluster`, `setSort`, `setLimit`, `setGridMode`, `selectItem`, `selectPair`, `setState`, `reset`), `definition`, `evaluator`, `compare(id1, id2)` (cache only while precomputing, so it never blocks), `format` (`number`, `value`, `uncertainty`, `range`), `labels`, `progress`, `isStale` and `warnings`.

`requires` says which pairs must be computed before `status` is `"ready"`: `"none"`, `"unit"` (each item × the unit; the default), `"items"` (all pairs of the shown items), `"all"` (all pairs in scope; the default for custom tabs) or a function `(data) => pairs` (it may close over props: when it returns other pairs, they're computed). A top 10 over 1,000 items with `"unit"` needs about 1,000 pairs, not a million, with `precompute="visible"`; `precompute` (true) adds a background pass over all the pairs in scope (a million here). `overrides` apply to this consumer only and are never written back: that's how a "top 5" widget sits next to the full list on one provider.

### S9: labels, numbers, density, theme

```tsx
const fr = new Intl.NumberFormat("fr-FR", { maximumSignificantDigits: 2 });
<RelativeValuesBundleDashboard
  bundle={bundle}
  themeClassName="acme-rv"
  labels={{
    "tab.list": "Liste",
    "list.searchPlaceholder": "Filtrer…",
    "list.valueInTermsOf": "Valeur estimée, en",
    "cell.rangeSeparator": "à",
    "sidebar.summary": (a, b) => (
      <>
        Valeur de {a} en {b}
      </>
    ),
    "search.chip": (query) => `Recherche : ${query}`,
  }}
  format={{
    locale: "fr-FR",
    uncertainty: "factor", // "×/÷ 2.5" instead of "± 0.4 om"
    precision: { value: 2 },
    formatNumber: (n, { kind }) =>
      kind === "median" ? fr.format(n) : undefined, // undefined: built-in
  }}
  display={{
    density: "compact",
    list: { itemIds: false },
    grid: { cellWidth: 112 },
  }}
/>;
```

```css
/* Your CSS: themeClassName also goes on the dropdown and tooltip portals. */
.acme-rv {
  --squiggle-rv-font-family: "Acme Sans", sans-serif;
  --squiggle-rv-accent: #0b3d91;
  --squiggle-rv-border: #d8dee9;
  --squiggle-rv-header-bg: #f5f7fb;
}
.acme-rv [data-rv-part="tab-bar"] {
  margin-inline-start: auto;
}
```

- `labels`: every built-in string, by key; see `defaultRelativeValuesLabels` for the keys and the English defaults.
- `format`: `locale` (name sort, progress counts), `precision` (significant digits of `value`, `uncertainty`, `range` and `summary`: 1 / 2 / 1 / 2), `uncertainty` (`"om"`, `"factor"` or `"hidden"`, in the cells and the sidebar), and `formatNumber(value, { kind, place, precision })` returning a string or undefined. `place` is `"list"`, `"grid"`, `"clusterGrid"`, `"sidebar"` or `"plot"` (the value / uncertainty plot's tick labels).
- `display`: `density` (`"comfortable"` or `"compact"`, which also adds `squiggle-rv-compact` to the root and portals); `list` (`groupByCluster`, `cell`, `descriptions`, `itemIds`, `clusterTags`, `sidebarPosition: "side" | "below"`); `grid` (`cell`, `heatmap`, `cellWidth`, `groupByCluster`); `plot` (`plots`, `height`, `titles`, `valueUncertainty`).
- CSS variables, set on any ancestor, or with `themeClassName` to reach portals too (custom properties aren't reset by the wrapper's `all: initial`): `--squiggle-rv-font-family`, `--squiggle-rv-font-size` (the base size: all text sizes are multiples of it; use px or rem), `--squiggle-rv-text`, `--squiggle-rv-muted`, `--squiggle-rv-bg`, `--squiggle-rv-border`, `--squiggle-rv-header-bg`, `--squiggle-rv-panel-bg` (the list sidebar, the search chip), `--squiggle-rv-accent` (selected tab, selected cell and dot, progress), `--squiggle-rv-selected-bg` (also cell hover), `--squiggle-rv-radius`, `--squiggle-rv-cell-padding`, `--squiggle-rv-grid-cell-width` and `--squiggle-rv-sidebar-width`. Each falls back to the default look; compact density changes the defaults of the last two, never values you set.
- Stable hooks for your CSS and tests: `data-rv-part` (`header`, `tab-bar`, `toolbar`, `list`, `list-table`, `list-row`, `list-unit`, `grid`, `grid-cell`, `grid-band`, `plot`, `sidebar`, `progress`, `search`, `search-chip`, `empty`, `custom`, `cluster-filter`, `cluster-diagram`, `sort-menu`, `unit-picker`, `grid-mode`), `data-rv-item` (list rows), `data-rv-row` / `data-rv-column` (grid cells), `data-rv-uncertainty` (a cell's uncertainty) and `data-rv-tier` (`1` to `5`, on its text and unit), `data-rv-count` (items shown by a view), `data-rv-ready` and `data-rv-computing`. The library's classes are scoped as `.squiggle-rv .x`, so your rules need a class and a part: `.acme-rv [data-rv-part="tab-bar"]`. Internal class names are not API.

A dark theme takes the variables above (example app, `#/s9`). Not themed: the canvas axes, the dropdown menus and tooltips (which keep @quri/ui's light styling), and the warm uncertainty colors of the cells, which you can recolor through `[data-rv-tier="3"]` (to `"5"`), e.g. `.squiggle-rv.acme-dark [data-rv-tier="5"] { color: #fca5a5; }`.

Not covered: plurals, right-to-left layouts, and number formatting in the live sidebar's Squiggle charts.

### S10: several dashboards on a page; server rendering

```tsx
// The same bundle object: one parse, one cache.
<RelativeValuesSingleView bundle={bundle} view="list" scope={{ clusters: ["platform"] }} />
<RelativeValuesSingleView bundle={bundle} view="grid" scope={{ clusters: ["platform"] }} />

// One live evaluator, two dashboards: each pair is computed once.
<RelativeValuesDashboard definition={definition} evaluator={evaluator} />
<RelativeValuesDashboard definition={definition} evaluator={evaluator} tabs={["grid"]} />

// One provider, two views, one state:
<RelativeValuesProvider definition={definition} evaluator={evaluator} precompute>
  <RelativeValuesRoot><RelativeValuesSearchBox /></RelativeValuesRoot>
  <RelativeValuesSingleView view="list" />
  <RelativeValuesSingleView view="plot" />
</RelativeValuesProvider>
```

Bundles are memoized per object (`loadRelativeValuesBundle`), and specs per (spec, cache, modelCode, environment). Several providers on one evaluator never compute a pair twice: the cache is checked before each pair.

Server rendering: nothing touches `window` or `document` at import or while rendering (the plots' simulation starts in an effect). Bundle mode renders the full markup on the server; live mode renders the fallback. State is plain JSON, so it crosses the server/client boundary: in Next.js, parse `searchParams` in the server component with `relativeValuesStateFromSearchParams(await searchParams)` (it accepts the record form) and pass the state and the bundle to a `"use client"` wrapper. `scope.where`, `sorts`, `components`, label functions and callbacks need the client wrapper.

### Reference

#### State

| Key            | Default                                                                                             | Meaning                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `view`         | the first tab (`"list"` for a provider)                                                             | active tab                                                                                         |
| `unit`         | `null`                                                                                              | global unit; `null`: recommended (each list table uses its cluster's recommended unit)             |
| `clusterUnits` | `{}`                                                                                                | per-table units of grouped lists, by cluster id (`UNCLUSTERED`, `""`, for items without a cluster) |
| `ids`          | `null`                                                                                              | allowlist of the shown items; its order is the default order                                       |
| `clusters`     | `null`                                                                                              | selected clusters (`null`: all; `[]`: none, so only items without a cluster)                       |
| `search`       | `""`                                                                                                | case-insensitive substring of name, id, description, cluster id or cluster name                    |
| `sort`         | `{ mode: "default", desc: false }`                                                                  | display order                                                                                      |
| `limit`        | `null`                                                                                              | keep the first N after ranking                                                                     |
| `limitBy`      | `null`                                                                                              | the ranking that picks the `limit` items (`null`: `sort`)                                          |
| `columns`      | `{ ids: null, clusters: null, sort: { mode: "default", desc: false }, limit: null, limitBy: null }` | the grid's columns: an independent axis, or `"rows"` to mirror the rows                            |
| `gridMode`     | `"full"`                                                                                            | `"half"` hides the upper triangle                                                                  |
| `selectedItem` | `null`                                                                                              | highlighted item                                                                                   |
| `selectedPair` | `null`                                                                                              | `[numerator, denominator]`: the list sidebar / `RelativeValuesPairDetails`                         |

Inputs are partial (`RelativeValuesStateInput`): a given key controls its whole value, and missing fields of an object value (`sort`, `limitBy`, `columns`) come from the defaults. `resolveRelativeValuesState`, `normalizeRelativeValuesState`, `pickRelativeValuesState` and `parseRelativeValuesState` (lenient: invalid fields are dropped with a warning) work with state outside of React.

#### The pipeline

`selectRelativeValues` is the one implementation behind every view, custom tab, `useRelativeValues`, `apiRef.getData()` and server code, so "the top 10 in units of SSO" means the same everywhere:

1. **Universe**: the definition's items, then `scope.ids` (and their order), `scope.clusters`, `scope.exclude`, `scope.where`.
2. **Filter**: `ids` (and their order: the default order), `clusters` (items without a cluster always pass; use `scope` to remove them), `search`.
3. **Ranking unit**: `unit`, else the definition's recommended unit, else the first item in scope. It may be outside the scope.
4. **Rank** by `limitBy ?? sort`, measured as item / unit, then **limit**, then **sort** the picked items by `sort`.
5. **Columns** (grid): the rows when `columns === "rows"`; otherwise the universe filtered by `columns.ids` and `columns.clusters`, ranked by `columns.limitBy ?? columns.sort`, limited by `columns.limit`, then sorted by `columns.sort`.

The pick is the same everywhere; views order the picked items with their own rules: grouped lists split them into cluster tables and measure value sorts against each table's unit (`clusterUnits[cluster]`, else `unit`, else the cluster's recommended unit, else the definition's, else the first item); the grid's value sorts average over the other axis ("Average value"), and `display.grid.groupByCluster` partitions rows and columns by cluster. `rows`, `useRelativeValues()` and `apiRef.getData()` keep the pipeline's order. For rankings, use a flat list (`display.list.groupByCluster: false`).

#### Controlled, uncontrolled and locked state

- Each key of `state` that isn't undefined is controlled; the others are uncontrolled, starting from `defaultState` (read on mount, like React's `defaultValue`; change the component's `key` to start over).
- Built-in UI and `actions` produce a new state; the uncontrolled keys update at once, and `onStateChange` is called. A controlled key doesn't change until you pass a new `state`: not updating it is how you reject a change. Several changes in one event build on each other's `next`.
- When you stop controlling a key, the dashboard keeps its last controlled value.
- Controlled values are compared by value, so a new object literal on every render is free.
- **Locked** keys (listed in `locked`, or controlled without a change handler: `onStateChange`, or `onTabChange` for `view`) ignore the built-in UI ("user" changes) and hide its controls; `actions` and `apiRef` ("api" changes) still apply. Hiding a control with `controls` doesn't lock its key.

| Locked key             | Hidden                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `view`                 | the tab bar                                                                              |
| `unit`, `clusterUnits` | unit dropdowns, compass icons, name clicks that set the unit, `RelativeValuesUnitPicker` |
| `clusters`             | "Clusters" sections, the plot's cluster panel, the cluster diagram                       |
| `search`               | the search box and the search chip                                                       |
| `sort`                 | the rows' "Sort by" section                                                              |
| `columns`              | Column Settings, the cluster diagram                                                     |
| `gridMode`             | the grid mode icons                                                                      |
| `selectedPair`         | cell clicks no longer select (`onPairClick` still fires)                                 |
| `selectedItem`         | plot dot clicks no longer select (`onItemClick` still fires)                             |

#### Unknown or stale ids

State is normalized whenever it's read (after a live reload, from a stale URL or old saved state); the stored values keep their raw ids, so an item that disappears and comes back gets its settings back. Each fix adds a message to `warnings` (and a development-mode `console.warn`, once per message): unknown views become the first tab; an unknown `unit` becomes `null`; `clusterUnits` entries with unknown clusters or items are ignored; unknown or out-of-scope `ids` are dropped (none left: nothing is shown); unknown `clusters` are dropped, and selecting every cluster in scope becomes `null`; unknown sort modes become `"default"`; a `limit` that isn't a positive integer becomes `null`; selections with unknown ids become `null`.

#### Computation

| Consumer                                   | Pairs                                                                      |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| ranking (value or custom sorts, `limitBy`) | the filtered items × the ranking unit (similarity: all their pairs), first |
| list                                       | each table's items × its unit, and all pairs within the table              |
| grid                                       | rows × columns, and all pairs of the rows                                  |
| plot                                       | all pairs of the shown items, and each item × the reference                |
| cluster diagram                            | all pairs in scope                                                         |
| custom tab or view                         | `requires` (default `"all"`)                                               |
| `useRelativeValues`                        | `requires` (default `"unit"`)                                              |

`precompute`: `true` (dashboards, standalone single views, and providers with a `bundle` or `spec`) computes what the mounted views need without blocking, then all pairs in scope in the background; `"visible"` skips the background pass; `false` (a provider with `definition` + `evaluator`) computes synchronously while rendering. While a new evaluator computes (e.g. after a live reload), the views keep showing the previous one (`isStale`).

#### URL format

Prefix `rv.` by default. Defaults are omitted, arrays are repeated params (so ids may contain any character), and other params are kept.

| Key                | Params                                                                         | Example                          |
| ------------------ | ------------------------------------------------------------------------------ | -------------------------------- |
| `view`             | `rv.view`                                                                      | `rv.view=grid`                   |
| `unit`             | `rv.unit`                                                                      | `rv.unit=sso`                    |
| `clusterUnits`     | `rv.cu.<clusterId>` (`rv.cu.` for items without a cluster)                     | `rv.cu.platform=dbMigration`     |
| `ids`              | `rv.ids`, repeated                                                             | `rv.ids=sso&rv.ids=auditLog`     |
| `clusters`         | `rv.cl`, repeated; one empty value is `[]`                                     | `rv.cl=platform&rv.cl=research`  |
| `search`           | `rv.q`                                                                         | `rv.q=audit`                     |
| `sort`             | `rv.sort`; a leading `-` is descending                                         | `rv.sort=-median`                |
| `limit`, `limitBy` | `rv.limit`, `rv.limitby`                                                       | `rv.limit=10&rv.limitby=-median` |
| `columns`          | `rv.cols=rows`, or `rv.cids`, `rv.ccl`, `rv.csort`, `rv.climit`, `rv.climitby` | `rv.cols=rows`                   |
| `gridMode`         | `rv.grid`                                                                      | `rv.grid=half`                   |
| `selectedItem`     | `rv.sel`                                                                       | `rv.sel=sso`                     |
| `selectedPair`     | `rv.pair`, twice                                                               | `rv.pair=sso&rv.pair=auditLog`   |

`relativeValuesStateFromSearchParams` returns every key in `keys` (default: all); an absent param gives the default, so URL-managed keys are always controlled and Back/Forward resets them. Invalid values become the default. `views` (default: the built-in tabs) are the valid views of both helpers and of `parseRelativeValuesState`, and the first one is the default view, which the writer omits and the reader returns for an absent param: pass the dashboard's tab ids to both helpers when its first tab isn't `"list"` or it has custom tabs (the writer warns in development when it gets a view that isn't a built-in tab and no `views`).

#### Changes in behavior

Compared with earlier versions of this package (no code changes are needed in Studio or Hub):

1. The list's search, per-table units and sidebar pair persist across tab switches. Search filters every view's primary axis; views without a search box show a "Search: x ×" chip.
2. The provider no longer resets filters, sort and grid mode when the set of clusters changes.
3. Custom tab `items` also reflect scope, search and limit; value sorts there are measured against the ranking unit.
4. The plot's y axis says "orders of magnitude" instead of "decibels".
5. Under `desc`, ties keep the default order, and missing values sort last.
6. Grid cell clicks highlight the cell (`selectedPair`); the list sidebar then shows that pair.
7. Empty results show the `Empty` slot instead of nothing.
8. The sort menus also offer "Name" and "Cluster", and the registered `sorts`.
9. The list sidebar's uncertainty is shown as in the cells (± half the 90% interval, in orders of magnitude), and follows `format.uncertainty`.
10. Menu section headers keep the labels' casing ("Sort by", no longer "Sort By").

## Development

```sh
pnpm build   # tsc + css (full.css and the scoped styles.css)
pnpm test    # jest
pnpm dev     # storybook
```

`styles.css` is scoped by [`postcss-scope.cjs`](./postcss-scope.cjs), a small PostCSS plugin that runs after Tailwind.
