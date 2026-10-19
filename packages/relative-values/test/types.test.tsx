// Compile-time checks of the public types (checked by `tsc -b`), ported from
// the API spec: Studio's and Hub's usage, inference of custom tab ids, and
// invalid props.
import { describe, expect, test } from "@jest/globals";

import type { SqLinker } from "@quri/squiggle-lang";

import {
  GridView,
  ListView,
  type ModelEvaluator,
  PlotView,
  relativeValuesStateFromSearchParams,
  RelativeValuesBundleDashboard,
  RelativeValuesDashboard,
  type RelativeValuesDefinition,
  type RelativeValuesHandle,
  RelativeValuesProvider,
  RelativeValuesSingleView,
  type RelativeValuesTab,
  type RelativeValuesTabContext,
  useRelativeValues,
} from "../src/index.js";

// Stand-ins; the elements below are only type-checked, never rendered.
declare const def: RelativeValuesDefinition;
declare const ev: ModelEvaluator;
declare const linker: SqLinker;
declare const bundle: unknown;

// Studio (packages/studio/src/client/views/RelativeValuesView.tsx).
export const studio = (
  tab: RelativeValuesTab,
  onTabChange: (t: RelativeValuesTab) => void
) => (
  <RelativeValuesDashboard
    definition={def}
    evaluator={ev}
    tab={tab}
    onTabChange={onTabChange}
    header={<div className="flex items-center gap-3" />}
    linker={linker}
    sourceId="file.squiggle"
  />
);

// Hub (RelativeValuesModelLayout + route pages).
export const hub = () => (
  <RelativeValuesProvider
    definition={def}
    evaluator={ev}
    getPlaygroundUrl={(code) => code}
  >
    <ListView />
    <GridView />
    <PlotView />
  </RelativeValuesProvider>
);

// Custom tab ids are inferred from `tabs` and flow through state and
// callbacks.
export const hostApp = () => (
  <RelativeValuesBundleDashboard
    bundle={bundle}
    height={640}
    tabs={[
      "list",
      {
        id: "ranking",
        label: "Ranking",
        render: (context: RelativeValuesTabContext) => context.items.length,
      },
      "grid",
      "plot",
    ]}
    clusterOverrides={{ research: { color: "#b7791f", name: "Research" } }}
    renderItemName={(item) => (
      <a href={`#/initiative/${item.id}`}>{item.name}</a>
    )}
    state={{ view: "ranking" }}
    onTabChange={(tab) => {
      const typed: "list" | "grid" | "plot" | "ranking" = tab;
      return typed;
    }}
    onStateChange={(next) => {
      const view: "list" | "grid" | "plot" | "ranking" = next.view;
      return view;
    }}
  />
);

// The handle keeps the view type.
export const handle = (api: { current: RelativeValuesHandle | null }) => {
  const view: RelativeValuesTab | undefined = api.current?.getState().view;
  return view;
};

// URL helpers type the view with `views`.
export const urlState = () => {
  const state = relativeValuesStateFromSearchParams("", {
    views: ["list", "ranking"] as const,
  });
  const view: "list" | "ranking" | undefined = state.view;
  return view;
};

// The tab context keeps its earlier fields.
export const legacyContext = (ctx: RelativeValuesTabContext) => {
  const { definition, evaluator, items, clusters } = ctx;
  return [
    definition.title,
    evaluator.canCompute,
    items[0]?.id,
    Object.keys(clusters),
  ];
};

// The hook's status narrows the evaluator.
export function useNarrowing() {
  const rv = useRelativeValues();
  if (rv.status === "ready" || rv.status === "computing") {
    const ready: ModelEvaluator = rv.evaluator;
    return ready;
  }
  // @ts-expect-error: no evaluator while loading or after an error
  const notReady: ModelEvaluator = rv.evaluator;
  return notReady;
}

export const badTab = () => (
  <RelativeValuesBundleDashboard
    bundle={bundle}
    // @ts-expect-error: unknown tab id
    initialTab="nope"
  />
);
export const badView = () => (
  // @ts-expect-error: unknown view in controlled state
  <RelativeValuesBundleDashboard bundle={bundle} state={{ view: "nope" }} />
);
export const twoSources = () => (
  // @ts-expect-error: two sources
  <RelativeValuesSingleView
    view="list"
    bundle={bundle}
    definition={def}
    evaluator={ev}
  />
);
export const stateWithoutSource = () => (
  // @ts-expect-error: state props need a source (state lives in the provider)
  <RelativeValuesSingleView view="list" state={{ unit: "x" }} />
);
export const badControl = () => (
  <RelativeValuesBundleDashboard
    bundle={bundle}
    // @ts-expect-error: unknown control
    controls={{ list: { nope: false } }}
  />
);
export const badLabel = () => (
  // @ts-expect-error: unknown label key
  <RelativeValuesBundleDashboard bundle={bundle} labels={{ "tab.nope": "x" }} />
);
export const badLock = () => (
  // @ts-expect-error: unknown lock key
  <RelativeValuesBundleDashboard bundle={bundle} locked={["nope"]} />
);

describe("types", () => {
  test("type checks are compile-time (tsc -b)", () => {
    expect(typeof badTab).toBe("function");
  });
});
