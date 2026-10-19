---
"@quri/squiggle-relative-values": minor
---

Host control for embedded dashboards:

- `RelativeValuesSingleView` (one view, no header or tab bar) and `useRelativeValues()` (headless data for custom views, with `requires` and local `overrides`).
- Flat, serializable state (`state`, `defaultState`, `onStateChange`, `locked`, `apiRef`): view, unit, cluster units, ids, clusters, search, sort, `limit` / `limitBy`, grid columns and mode, selection. URL and storage helpers (`relativeValuesStateFromSearchParams`, `relativeValuesStateToSearchParams`, `parseRelativeValuesState`, `pickRelativeValuesState`).
- `scope` (ids, clusters, exclude, a predicate) and custom `sorts`; new sort modes `name` and `cluster`.
- Presentation: `controls`, `components` slots (each with `Default`), `labels`, `format`, `display`, `themeClassName`, compact density, CSS variables and `data-rv-part` hooks, `onPairClick`.
- Primitives for host layouts: search box, sort menu, unit picker, grid mode controls, cluster diagram, pair details, progress bar.
- `selectRelativeValues` (the React-free pipeline) and `ModelEvaluator.peek`; bundles and spec evaluators are shared across components.
- Server rendering leaves no timers (the plot simulation starts in an effect).

Existing props, exports and hooks keep working; see the README's "Customizing in your app" for the behavior changes.
