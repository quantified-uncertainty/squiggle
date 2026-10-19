import { describe, expect, jest, test } from "@jest/globals";
import fs from "node:fs";

import { run } from "@quri/squiggle-lang";

import {
  findRelativeValuesExports,
  type Item,
  type ItemPair,
  ModelEvaluator,
  parseRelativeValuesBundle,
  type RelativeValuesDefinition,
  requiredRelativeValuesPairs,
  selectRelativeValues,
} from "../src/index.js";
import { listPairs } from "../src/state/pairs.js";

function loadPortfolio() {
  const json: unknown = JSON.parse(
    fs.readFileSync(
      new URL(
        "../examples/host-app/src/data/portfolio.bundle.json",
        import.meta.url
      ),
      "utf-8"
    )
  );
  const parsed = parseRelativeValuesBundle(json);
  if (!parsed.ok) throw new Error(parsed.value);
  return {
    definition: parsed.value.definition,
    evaluator: ModelEvaluator.fromBundle(parsed.value),
  };
}

const { definition, evaluator } = loadPortfolio();
const ids = (items: readonly Item[]) => items.map((item) => item.id);
const median = (id: string, unit: string) => {
  const result = evaluator.compare(id, unit);
  if (!result.ok) throw new Error(result.value);
  return result.value.median;
};

describe("scope", () => {
  test("ids keep their order; the universe bounds everything", () => {
    const data = selectRelativeValues({
      definition,
      evaluator,
      scope: { ids: ["ciSpeedup", "sso", "nope", "auditLog"] },
    });
    expect(ids(data.universe)).toEqual(["ciSpeedup", "sso", "auditLog"]);
    expect(ids(data.items)).toEqual(["ciSpeedup", "sso", "auditLog"]);
    expect(ids(data.columns)).toEqual(["ciSpeedup", "sso", "auditLog"]);
    expect(data.warnings.join()).toContain("nope");
  });

  test("clusters, null for unclustered items, exclude and where", () => {
    const withLoose: RelativeValuesDefinition = {
      ...definition,
      items: [
        ...definition.items,
        { id: "loose", name: "Loose item", clusterId: null, description: "" },
      ],
    };
    const platform = selectRelativeValues({
      definition: withLoose,
      evaluator,
      scope: { clusters: ["platform"] },
    });
    expect(
      platform.universe.every((item) => item.clusterId === "platform")
    ).toBe(true);
    const withNull = selectRelativeValues({
      definition: withLoose,
      evaluator,
      scope: { clusters: ["platform", null], exclude: ["ciSpeedup"] },
    });
    expect(ids(withNull.universe)).toEqual([
      "dbMigration",
      "observability",
      "costDashboards",
      "loose",
    ]);
    const where = selectRelativeValues({
      definition: withLoose,
      evaluator,
      scope: { where: (item, cluster) => cluster?.id === "research" },
    });
    expect(ids(where.universe)).toEqual([
      "forecastingModel",
      "anomalyDetection",
      "pricingExperiment",
    ]);
  });
});

describe("filter", () => {
  test("ids, then clusters, then search", () => {
    const data = selectRelativeValues({
      definition,
      evaluator,
      state: {
        ids: ["ciSpeedup", "sso", "dbMigration", "forecastingModel"],
        clusters: ["platform", "enterprise"],
        search: "i",
      },
    });
    // "Single sign-on" and "CI speedup" match "i"; "Database migration" too.
    expect(ids(data.items)).toEqual(["ciSpeedup", "sso", "dbMigration"]);
  });

  test("search fields: name, id, description, cluster id and cluster name", () => {
    const search = (q: string) =>
      ids(
        selectRelativeValues({ definition, evaluator, state: { search: q } })
          .items
      );
    expect(search("AUDIT")).toEqual(["auditLog"]);
    expect(search("usagebill")).toEqual(["usageBilling"]);
    expect(search("research")).toEqual([
      "forecastingModel",
      "anomalyDetection",
      "pricingExperiment",
    ]);
    const renamed = {
      ...definition,
      clusters: definition.clusters.map((c) =>
        c.id === "research" ? { ...c, name: "Data science" } : c
      ),
      items: definition.items.map((item) =>
        item.id === "sso" ? { ...item, description: "Okta integration" } : item
      ),
    };
    expect(
      ids(
        selectRelativeValues({
          definition: renamed,
          evaluator,
          state: { search: "data sci" },
        }).items
      )
    ).toHaveLength(3);
    expect(
      ids(
        selectRelativeValues({
          definition: renamed,
          evaluator,
          state: { search: "okta" },
        }).items
      )
    ).toEqual(["sso"]);
  });
});

describe("sort", () => {
  const sorted = (mode: string, desc = false, unit = "sso") =>
    ids(
      selectRelativeValues({
        definition,
        evaluator,
        state: { unit, sort: { mode, desc } },
        sorts: {
          byIdLength: {
            label: "Id length",
            compare: (a, b) => a.item.id.length - b.item.id.length,
          },
        },
      }).items
    );

  test("median, against the unit, ascending and descending", () => {
    const asc = sorted("median");
    const values = asc.map((id) => median(id, "sso"));
    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(sorted("median", true)).toEqual([...asc].reverse());
  });

  test("name and cluster", () => {
    const byName = sorted("name");
    expect(byName[0]).toBe("anomalyDetection");
    expect(byName.at(-1)).toBe("winBackEmails");
    expect(sorted("name", true)[0]).toBe("winBackEmails");
    const byCluster = sorted("cluster", true);
    // Clusters reversed; ties (same cluster) keep the default order.
    expect(byCluster.slice(0, 3)).toEqual([
      "forecastingModel",
      "anomalyDetection",
      "pricingExperiment",
    ]);
  });

  test("ties keep the default order in both directions; custom compare", () => {
    const asc = sorted("byIdLength");
    const desc = sorted("byIdLength", true);
    const lengths = asc.map((id) => id.length);
    expect(lengths).toEqual([...lengths].sort((a, b) => a - b));
    // "sso" is the only 3-letter id; "inAppHelp" and "ciSpeedup" tie (9).
    expect(asc.indexOf("inAppHelp")).toBeLessThan(asc.indexOf("ciSpeedup"));
    expect(desc.indexOf("inAppHelp")).toBeLessThan(desc.indexOf("ciSpeedup"));
    expect(desc.at(-1)).toBe("sso");
  });

  test("missing values and errors sort last in both directions", () => {
    const broken: RelativeValuesDefinition = {
      ...definition,
      items: [
        { id: "ghost", name: "Ghost", clusterId: null, description: "" },
        ...definition.items,
      ],
    };
    for (const desc of [false, true]) {
      const data = selectRelativeValues({
        definition: broken,
        evaluator,
        state: { unit: "sso", sort: { mode: "median", desc } },
      });
      expect(data.items.at(-1)?.id).toBe("ghost");
      expect(data.rows.at(-1)?.result?.ok).toBe(false);
    }
  });

  test("similarity: a chain from the first item", () => {
    const chain = sorted("similarity");
    expect(chain[0]).toBe("sso");
    expect(new Set(chain).size).toBe(definition.items.length);
    expect(sorted("similarity", true)).toEqual([...chain].reverse());
  });
});

describe("limit", () => {
  test("top N by value in units of X", () => {
    const data = selectRelativeValues({
      definition,
      evaluator,
      state: {
        unit: "ciSpeedup",
        sort: { mode: "median", desc: true },
        limit: 5,
      },
    });
    const expected = definition.items
      .map((item) => ({ id: item.id, median: median(item.id, "ciSpeedup") }))
      .sort((a, b) => b.median - a.median)
      .slice(0, 5)
      .map((row) => row.id);
    expect(ids(data.items)).toEqual(expected);
    expect(data.rows.map((row) => row.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(data.rows.every((row) => row.unit.id === "ciSpeedup")).toBe(true);
    expect(data.filtered).toHaveLength(definition.items.length);
  });

  test("limitBy picks the same set, sort orders it", () => {
    const top = selectRelativeValues({
      definition,
      evaluator,
      state: { unit: "sso", sort: { mode: "median", desc: true }, limit: 6 },
    });
    const byName = selectRelativeValues({
      definition,
      evaluator,
      state: {
        unit: "sso",
        limit: 6,
        limitBy: { mode: "median", desc: true },
        sort: { mode: "name" },
      },
    });
    expect(new Set(ids(byName.items))).toEqual(new Set(ids(top.items)));
    const names = byName.items.map((item) => item.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(ids(byName.items)).not.toEqual(ids(top.items));
  });

  test("limit with the default sort is the first N", () => {
    const data = selectRelativeValues({
      definition,
      evaluator,
      state: { limit: 2 },
    });
    expect(ids(data.items)).toEqual(["sso", "auditLog"]);
  });
});

describe("units and columns", () => {
  test("ranking unit: state, else recommended, else the first in scope", () => {
    expect(selectRelativeValues({ definition, evaluator }).unit?.id).toBe(
      "sso"
    );
    expect(
      selectRelativeValues({
        definition,
        evaluator,
        state: { unit: "ciSpeedup" },
      }).unit?.id
    ).toBe("ciSpeedup");
    // Out of scope is fine.
    expect(
      selectRelativeValues({
        definition,
        evaluator,
        state: { unit: "ciSpeedup" },
        scope: { clusters: ["research"] },
      }).unit?.id
    ).toBe("ciSpeedup");
    expect(
      selectRelativeValues({
        definition: { ...definition, recommendedUnit: null },
        evaluator,
        scope: { clusters: ["research"] },
      }).unit?.id
    ).toBe("forecastingModel");
  });

  test("tableUnit resolution order", () => {
    const tableUnit = (
      state: Parameters<typeof selectRelativeValues>[0]["state"]
    ) => {
      const data = selectRelativeValues({ definition, evaluator, state });
      return ["platform", "research", null].map(
        (cluster) => data.tableUnit(cluster)?.id
      );
    };
    // Cluster recommended units, else the definition's.
    expect(tableUnit({})).toEqual(["ciSpeedup", "forecastingModel", "sso"]);
    // The global unit wins over recommended units.
    expect(tableUnit({ unit: "auditLog" })).toEqual([
      "auditLog",
      "auditLog",
      "auditLog",
    ]);
    // Per-table picks win over the global unit.
    expect(
      tableUnit({
        unit: "auditLog",
        clusterUnits: { platform: "dbMigration", "": "sso" },
      })
    ).toEqual(["dbMigration", "auditLog", "sso"]);
  });

  test("column axis: mirror, ids, clusters, sort and limit", () => {
    const mirrored = selectRelativeValues({
      definition,
      evaluator,
      state: { columns: "rows", clusters: ["research"] },
    });
    expect(mirrored.columns).toBe(mirrored.items);
    const independent = selectRelativeValues({
      definition,
      evaluator,
      state: {
        clusters: ["research"],
        search: "pricing",
        columns: {
          clusters: ["platform", "enterprise"],
          sort: { mode: "median", desc: true },
          limit: 3,
        },
      },
    });
    expect(ids(independent.items)).toEqual(["pricingExperiment"]);
    const expected = definition.items
      .filter((item) =>
        ["platform", "enterprise"].includes(item.clusterId ?? "")
      )
      .map((item) => ({ id: item.id, median: median(item.id, "sso") }))
      .sort((a, b) => b.median - a.median)
      .slice(0, 3)
      .map((row) => row.id);
    // Search doesn't apply to columns.
    expect(ids(independent.columns)).toEqual(expected);
    const byIds = selectRelativeValues({
      definition,
      evaluator,
      state: { columns: { ids: ["ciSpeedup", "sso"] } },
    });
    expect(ids(byIds.columns)).toEqual(["ciSpeedup", "sso"]);
  });
});

describe("computation", () => {
  test('compute: "cached" never runs Squiggle', async () => {
    const live = await ModelEvaluator.create(
      `spec = { values: { a: 1, b: 2 to 5, c: 3 to 8 } }`,
      "spec"
    );
    if (!live.ok) throw new Error(live.value);
    const liveEvaluator = live.value;
    const liveDefinition: RelativeValuesDefinition = {
      title: "",
      items: ["a", "b", "c"].map((id) => ({
        id,
        name: id,
        clusterId: null,
        description: "",
      })),
      clusters: [],
    };
    const spy = jest.spyOn(liveEvaluator, "compareWithoutCache");
    const cached = selectRelativeValues({
      definition: liveDefinition,
      evaluator: liveEvaluator,
      state: { sort: { mode: "median", desc: true }, limit: 2 },
      compute: "cached",
    });
    expect(spy).not.toHaveBeenCalled();
    expect(cached.rows.every((row) => row.result === undefined)).toBe(true);
    expect(liveEvaluator.peek("b", "a")).toBeUndefined();

    const sync = selectRelativeValues({
      definition: liveDefinition,
      evaluator: liveEvaluator,
      state: { sort: { mode: "median", desc: true }, limit: 2 },
    });
    expect(spy).toHaveBeenCalled();
    expect(ids(sync.items)).toEqual(["c", "b"]);
    expect(liveEvaluator.peek("b", "a")?.ok).toBe(true);
  });
});

describe("required pairs", () => {
  test("top 10 over a 120-item model needs 120 pairs", async () => {
    const code = fs.readFileSync(
      new URL(
        "../examples/host-app/models/large-catalog.squiggle",
        import.meta.url
      ),
      "utf-8"
    );
    const [found] = findRelativeValuesExports(await run(code));
    if (!found.spec.ok) throw new Error(found.spec.value);
    const spec = found.spec.value;
    const fresh = await ModelEvaluator.fromSpec(spec);
    if (!fresh.ok) throw new Error(fresh.value);
    const data = selectRelativeValues({
      definition: spec.definition,
      evaluator: fresh.value,
      state: { sort: { mode: "median", desc: true }, limit: 10 },
      compute: "cached",
    });
    expect(data.items).toHaveLength(10);
    expect(requiredRelativeValuesPairs(data, "unit")).toHaveLength(120);
    expect(requiredRelativeValuesPairs(data, "all")).toHaveLength(120 * 120);
  });

  test("list pairs without state match the pairs the list always needed", () => {
    const data = selectRelativeValues({ definition, evaluator });
    // Before host control: each item with its cluster's unit, plus all pairs
    // within each cluster.
    const expected = new Set<string>();
    for (const cluster of definition.clusters) {
      const members = definition.items.filter(
        (i) => i.clusterId === cluster.id
      );
      for (const a of members) {
        expected.add(`${a.id}/${cluster.recommendedUnit ?? "sso"}`);
        for (const b of members) expected.add(`${a.id}/${b.id}`);
      }
    }
    const actual = new Set(
      requiredRelativeValuesPairs(data, "list").map(([a, b]) => `${a}/${b}`)
    );
    expect(actual).toEqual(expected);
    expect(listPairs(data)).toHaveLength(expected.size);
  });

  test("a scope of 10 items gives at most 100 pairs", () => {
    const data = selectRelativeValues({
      definition,
      evaluator,
      scope: { ids: ids(definition.items.slice(0, 10)) },
    });
    const all: ItemPair[] = requiredRelativeValuesPairs(data, "all");
    expect(all.length).toBe(100);
    expect(
      requiredRelativeValuesPairs(data, "grid").length
    ).toBeLessThanOrEqual(100);
    expect(requiredRelativeValuesPairs(data, "none")).toEqual([]);
  });
});
