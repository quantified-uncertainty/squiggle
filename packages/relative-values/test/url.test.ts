import { describe, expect, test } from "@jest/globals";

import {
  relativeValuesStateFromSearchParams,
  relativeValuesStateKeys,
  relativeValuesStateToSearchParams,
  resolveRelativeValuesState,
  type RelativeValuesState,
  UNCLUSTERED,
} from "../src/index.js";

const full: RelativeValuesState = {
  view: "grid",
  unit: "sso",
  clusterUnits: { platform: "dbMigration", [UNCLUSTERED]: "misc" },
  ids: ["sso", "a,b", "x~y&z", "with space", "émoji 🚀"],
  clusters: [],
  search: "audit & log",
  sort: { mode: "median", desc: true },
  limit: 10,
  limitBy: { mode: "uncertainty", desc: false },
  columns: {
    ids: ["sso"],
    clusters: ["platform", "research"],
    sort: { mode: "name", desc: true },
    limit: 5,
    limitBy: { mode: "median", desc: true },
  },
  gridMode: "half",
  selectedItem: "sso",
  selectedPair: ["sso", "auditLog"],
};

describe("URL helpers", () => {
  test("round trip of every key", () => {
    const params = relativeValuesStateToSearchParams(full);
    const parsed = relativeValuesStateFromSearchParams(params.toString());
    expect(resolveRelativeValuesState(parsed, { view: "list" })).toEqual(full);
  });

  test("format", () => {
    const params = relativeValuesStateToSearchParams(full);
    expect(params.get("rv.view")).toBe("grid");
    expect(params.get("rv.sort")).toBe("-median");
    expect(params.get("rv.limitby")).toBe("uncertainty");
    expect(params.getAll("rv.cl")).toEqual([""]);
    expect(params.get("rv.cu.")).toBe("misc");
    expect(params.get("rv.cu.platform")).toBe("dbMigration");
    expect(params.getAll("rv.pair")).toEqual(["sso", "auditLog"]);
    expect(params.getAll("rv.ids")).toHaveLength(5);
    expect(
      relativeValuesStateToSearchParams({ columns: "rows" }).toString()
    ).toBe("rv.cols=rows");
  });

  test("defaults are omitted; absent keys give defaults", () => {
    const defaults = resolveRelativeValuesState(undefined, { view: "list" });
    expect(relativeValuesStateToSearchParams(defaults).toString()).toBe("");
    const parsed = relativeValuesStateFromSearchParams("");
    expect(Object.keys(parsed).sort()).toEqual(
      [...relativeValuesStateKeys].sort()
    );
    expect(resolveRelativeValuesState(parsed, { view: "list" })).toEqual(
      defaults
    );
  });

  test("base params, other keys and other prefixes are kept", () => {
    const base = "page=2&rv.unit=old&b.unit=other&rv.q=keep";
    const params = relativeValuesStateToSearchParams(
      { unit: "new", search: "ignored" },
      { keys: ["unit"], base }
    );
    expect(params.get("page")).toBe("2");
    expect(params.get("rv.unit")).toBe("new");
    expect(params.get("b.unit")).toBe("other");
    expect(params.get("rv.q")).toBe("keep");
    // Unsetting a key removes its params.
    const unset = relativeValuesStateToSearchParams(
      { unit: null, clusterUnits: {} },
      { base: "rv.unit=x&rv.cu.a=b&rv.cu.=c", keys: ["unit", "clusterUnits"] }
    );
    expect(unset.toString()).toBe("");
  });

  test("two prefixes in one URL", () => {
    let params = relativeValuesStateToSearchParams(
      { unit: "a", sort: { mode: "name" } },
      { prefix: "left." }
    );
    params = relativeValuesStateToSearchParams(
      { unit: "b", gridMode: "half" },
      { prefix: "right.", base: params }
    );
    expect(
      relativeValuesStateFromSearchParams(params, {
        prefix: "left.",
        keys: ["unit", "sort", "gridMode"],
      })
    ).toEqual({
      unit: "a",
      sort: { mode: "name", desc: false },
      gridMode: "full",
    });
    expect(
      relativeValuesStateFromSearchParams(params, {
        prefix: "right.",
        keys: ["unit", "gridMode"],
      })
    ).toEqual({ unit: "b", gridMode: "half" });
  });

  test("views validate the view; invalid values become defaults", () => {
    const views = ["list", "ranking", "grid"] as const;
    const parsed = relativeValuesStateFromSearchParams(
      "rv.view=ranking&rv.limit=abc&rv.grid=quarter&rv.pair=a",
      { views }
    );
    const view: "list" | "ranking" | "grid" | undefined = parsed.view;
    expect(view).toBe("ranking");
    expect(parsed.limit).toBeNull();
    expect(parsed.gridMode).toBe("full");
    expect(parsed.selectedPair).toBeNull();
    expect(
      relativeValuesStateFromSearchParams("rv.view=ranking", { keys: ["view"] })
    ).toEqual({ view: "list" });
    expect(
      relativeValuesStateFromSearchParams("rv.limit=0&rv.climit=-1", {
        keys: ["limit"],
      })
    ).toEqual({ limit: null });
  });

  test("Next.js searchParams records", () => {
    expect(
      relativeValuesStateFromSearchParams(
        {
          "rv.cl": ["platform", "research"],
          "rv.unit": "sso",
          other: undefined,
        },
        { keys: ["clusters", "unit"] }
      )
    ).toEqual({ clusters: ["platform", "research"], unit: "sso" });
  });
});
