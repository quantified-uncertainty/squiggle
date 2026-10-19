import { describe, expect, test } from "@jest/globals";

import {
  defaultRelativeValuesState,
  normalizeRelativeValuesState,
  parseRelativeValuesState,
  pickRelativeValuesState,
  reduceRelativeValuesState,
  type RelativeValuesDefinition,
  type RelativeValuesState,
  resolveRelativeValuesState,
} from "../src/index.js";
import {
  fromLegacyAction,
  type RelativeValuesReducerContext,
} from "../src/state/reducer.js";

const definition: RelativeValuesDefinition = {
  title: "Test",
  items: [
    { id: "a", name: "Apple", clusterId: "fruit", description: "" },
    { id: "b", name: "Banana", clusterId: "fruit", description: "" },
    { id: "c", name: "Carrot", clusterId: "veg", description: "" },
    { id: "d", name: "Dill", clusterId: "herb", description: "" },
    { id: "e", name: "Egg", clusterId: null, description: "" },
  ],
  clusters: [
    { id: "fruit", name: "Fruit", color: "#f00" },
    { id: "veg", name: "Vegetables", color: "#0f0" },
    { id: "herb", name: "Herbs", color: "#00f" },
  ],
  recommendedUnit: "a",
};

const base = resolveRelativeValuesState<string>(undefined, { view: "list" });

const normalize = (
  input: Parameters<typeof resolveRelativeValuesState<string>>[0],
  extra: Partial<
    Parameters<typeof normalizeRelativeValuesState<string>>[1]
  > = {}
) =>
  normalizeRelativeValuesState(
    resolveRelativeValuesState<string>(input, { view: "list" }),
    { definition, views: ["list", "grid", "plot"], ...extra }
  );

const reducerContext: RelativeValuesReducerContext = {
  universeClusters: ["fruit", "veg", "herb"],
  initial: base,
};

describe("resolveRelativeValuesState", () => {
  test("fills defaults", () => {
    expect(base).toEqual({ ...defaultRelativeValuesState, view: "list" });
  });

  test("partial object values are completed from the defaults", () => {
    const state = resolveRelativeValuesState(
      {
        sort: { desc: true },
        columns: { limit: 3 },
        limitBy: { mode: "median" },
      },
      { view: "grid" }
    );
    expect(state.view).toBe("grid");
    expect(state.sort).toEqual({ mode: "default", desc: true });
    expect(state.columns).toEqual({
      ids: null,
      clusters: null,
      sort: { mode: "default", desc: false },
      limit: 3,
    });
    expect(state.limitBy).toEqual({ mode: "median", desc: false });
  });

  test("null is an ordinary value", () => {
    const state = resolveRelativeValuesState(
      { unit: null, limitBy: null, columns: "rows" },
      { view: "list" }
    );
    expect(state.unit).toBeNull();
    expect(state.limitBy).toBeNull();
    expect(state.columns).toBe("rows");
  });
});

describe("normalizeRelativeValuesState", () => {
  test("a valid state is unchanged, with no warnings", () => {
    const { state, warnings } = normalize({
      unit: "b",
      clusters: ["fruit"],
      ids: ["b", "a"],
      clusterUnits: { fruit: "b", "": "e" },
    });
    expect(warnings).toEqual([]);
    expect(state.unit).toBe("b");
    expect(state.clusters).toEqual(["fruit"]);
    expect(state.ids).toEqual(["b", "a"]);
    expect(state.clusterUnits).toEqual({ fruit: "b", "": "e" });
  });

  test("stale unit becomes recommended (null)", () => {
    const { state, warnings } = normalize({ unit: "gone" });
    expect(state.unit).toBeNull();
    expect(warnings).toHaveLength(1);
  });

  test("unknown view becomes the first view", () => {
    expect(normalize({ view: "nope" }).state.view).toBe("list");
    // An empty view list accepts any view.
    expect(normalize({ view: "custom" }, { views: [] }).state.view).toBe(
      "custom"
    );
  });

  test("ids: unknown and out-of-scope ids are dropped", () => {
    expect(normalize({ ids: ["a", "zzz", "c"] }).state.ids).toEqual(["a", "c"]);
    expect(
      normalize({ ids: ["a", "c"] }, { scope: { clusters: ["fruit"] } }).state
        .ids
    ).toEqual(["a"]);
  });

  test("ids: all unknown gives an empty list, not all items", () => {
    const { state, warnings } = normalize({ ids: ["x", "y"] });
    expect(state.ids).toEqual([]);
    expect(warnings[0]).toContain("x, y");
  });

  test("clusters: unknown dropped, all clusters become null, [] kept", () => {
    expect(normalize({ clusters: ["fruit", "nope"] }).state.clusters).toEqual([
      "fruit",
    ]);
    expect(
      normalize({ clusters: ["herb", "veg", "fruit"] }).state.clusters
    ).toBeNull();
    expect(normalize({ clusters: [] }).state.clusters).toEqual([]);
    // "All" means all clusters in scope.
    expect(
      normalize(
        { clusters: ["fruit", "veg"] },
        { scope: { clusters: ["fruit", "veg"] } }
      ).state.clusters
    ).toBeNull();
  });

  test("unknown sort modes become default; registered ones are kept", () => {
    expect(
      normalize({ sort: { mode: "revenue", desc: true } }).state.sort
    ).toEqual({ mode: "default", desc: true });
    expect(
      normalize(
        { sort: { mode: "revenue", desc: true } },
        { sorts: { revenue: { label: "Revenue", compare: () => 0 } } }
      ).state.sort
    ).toEqual({ mode: "revenue", desc: true });
    expect(normalize({ limitBy: { mode: "nope" } }).state.limitBy).toEqual({
      mode: "default",
      desc: false,
    });
  });

  test.each([0, -1, 2.5, Number.NaN])("limit %p becomes null", (limit) => {
    expect(normalize({ limit }).state.limit).toBeNull();
    expect(normalize({ columns: { limit } }).state.columns).toMatchObject({
      limit: null,
    });
  });

  test("columns are normalized like the rows", () => {
    expect(
      normalize({
        columns: { ids: ["a", "nope"], clusters: ["fruit", "veg", "herb"] },
      }).state.columns
    ).toMatchObject({ ids: ["a"], clusters: null });
  });

  test("selection and cluster units with unknown ids", () => {
    const { state } = normalize({
      selectedItem: "nope",
      selectedPair: ["a", "nope"],
      clusterUnits: { fruit: "nope", nocluster: "a", veg: "c" },
    });
    expect(state.selectedItem).toBeNull();
    expect(state.selectedPair).toBeNull();
    expect(state.clusterUnits).toEqual({ veg: "c" });
  });
});

describe("reducer", () => {
  const reduce = (
    state: RelativeValuesState<string>,
    action: Parameters<typeof reduceRelativeValuesState>[1]
  ) => reduceRelativeValuesState(state, action, reducerContext);

  test("toggling a cluster from null, and back to null", () => {
    const off = reduce(base, {
      type: "toggleCluster",
      cluster: "veg",
      axis: "rows",
    });
    expect(off.clusters).toEqual(["fruit", "herb"]);
    const on = reduce(off, {
      type: "toggleCluster",
      cluster: "veg",
      axis: "rows",
    });
    expect(on.clusters).toBeNull();
  });

  test("a global setUnit clears clusterUnits; a cluster setUnit doesn't", () => {
    const perTable = reduce(base, {
      type: "setUnit",
      unit: "b",
      cluster: "fruit",
    });
    expect(perTable.clusterUnits).toEqual({ fruit: "b" });
    expect(perTable.unit).toBeNull();
    const unclustered = reduce(perTable, {
      type: "setUnit",
      unit: "e",
      cluster: null,
    });
    expect(unclustered.clusterUnits).toEqual({ fruit: "b", "": "e" });
    const global = reduce(unclustered, { type: "setUnit", unit: "c" });
    expect(global.unit).toBe("c");
    expect(global.clusterUnits).toEqual({});
  });

  test("the cluster diagram turns a mirrored grid into an independent axis", () => {
    const mirrored = {
      ...base,
      columns: "rows" as const,
      sort: { mode: "name", desc: true },
    };
    const next = reduce(mirrored, {
      type: "clusterCombination",
      row: "fruit",
      column: "veg",
    });
    expect(next.clusters).toEqual(["fruit"]);
    expect(next.columns).toEqual({
      ids: null,
      clusters: ["veg"],
      sort: { mode: "name", desc: true },
      limit: null,
    });
  });

  test("setSort merges into the current sort, per axis", () => {
    const sorted = reduce(base, {
      type: "setSort",
      sort: { mode: "median" },
      axis: "rows",
    });
    expect(sorted.sort).toEqual({ mode: "median", desc: false });
    const desc = reduce(sorted, {
      type: "setSort",
      sort: { desc: true },
      axis: "rows",
    });
    expect(desc.sort).toEqual({ mode: "median", desc: true });
    const columns = reduce(base, {
      type: "setSort",
      sort: { mode: "uncertainty" },
      axis: "columns",
    });
    expect(columns.columns).toMatchObject({ sort: { mode: "uncertainty" } });
  });

  test("set and reset", () => {
    const set = reduce(base, {
      type: "set",
      input: { search: "x", sort: { mode: "name" } },
    });
    expect(set.search).toBe("x");
    expect(set.sort).toEqual({ mode: "name", desc: false });
    const reset = reduce(set, { type: "reset", keys: ["search"] });
    expect(reset.search).toBe("");
    expect(reset.sort).toEqual({ mode: "name", desc: false });
    expect(reduce(set, { type: "reset" })).toEqual(base);
  });

  // The reducer before host control kept a Set of selected clusters per axis,
  // starting with all clusters.
  test("legacy actions give the same results as the old reducer", () => {
    const all = new Set(["fruit", "veg", "herb"]);
    const toggle = (set: Set<string>, id: string) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    };
    const asSet = (clusters: readonly string[] | null) =>
      new Set(clusters ?? ["fruit", "veg", "herb"]);

    let state: RelativeValuesState<string> = base;
    let legacyRows = all;
    let legacyColumns = all;
    for (const id of ["veg", "fruit", "veg", "herb", "fruit", "herb"]) {
      state = reduce(
        state,
        fromLegacyAction({
          type: "toggleCluster",
          payload: { axis: "rows", id },
        })
      );
      legacyRows = toggle(legacyRows, id);
      expect(asSet(state.clusters)).toEqual(legacyRows);
    }
    state = reduce(
      state,
      fromLegacyAction({
        type: "toggleClusterCombination",
        payload: { row: "veg", column: "herb" },
      })
    );
    legacyRows = new Set(["veg"]);
    legacyColumns = new Set(["herb"]);
    expect(asSet(state.clusters)).toEqual(legacyRows);
    expect(
      asSet(state.columns === "rows" ? null : state.columns.clusters)
    ).toEqual(legacyColumns);

    state = reduce(
      state,
      fromLegacyAction({
        type: "setSort",
        payload: { axis: "columns", sort: { mode: "median", desc: true } },
      })
    );
    expect(state.columns).toMatchObject({
      sort: { mode: "median", desc: true },
    });
    expect(state.sort).toEqual({ mode: "default", desc: false });

    state = reduce(
      state,
      fromLegacyAction({ type: "setGridMode", payload: "half" })
    );
    expect(state.gridMode).toBe("half");
  });
});

describe("parseRelativeValuesState and pickRelativeValuesState", () => {
  test("valid keys are kept, invalid ones dropped with warnings", () => {
    const { state, warnings } = parseRelativeValuesState({
      unit: "a",
      sort: { mode: "median", desc: true },
      limit: "ten",
      gridMode: "half",
      nope: 1,
      view: "ranking",
    });
    expect(state).toEqual({
      unit: "a",
      sort: { mode: "median", desc: true },
      gridMode: "half",
      view: "ranking",
    });
    expect(warnings).toHaveLength(2);
  });

  test("views validate the view; non-objects never throw", () => {
    expect(
      parseRelativeValuesState({ view: "ranking" }, { views: ["list", "grid"] })
        .state
    ).toEqual({});
    expect(parseRelativeValuesState(null)).toEqual({ state: {}, warnings: [] });
    expect(parseRelativeValuesState("x").warnings).toHaveLength(1);
    expect(parseRelativeValuesState([1]).state).toEqual({});
  });

  test("pick", () => {
    expect(
      pickRelativeValuesState({ ...base, unit: "a" }, ["unit", "gridMode"])
    ).toEqual({ unit: "a", gridMode: "full" });
  });
});
