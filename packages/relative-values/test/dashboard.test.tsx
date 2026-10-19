import { describe, expect, test } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";

import { run } from "@quri/squiggle-lang";

import {
  createRelativeValuesBundle,
  findRelativeValuesExports,
  ModelEvaluator,
  RelativeValuesBundle,
  RelativeValuesBundleDashboard,
  RelativeValuesDashboard,
} from "../src/index.js";
import { readExample } from "./helpers.js";

async function setup() {
  const [found] = findRelativeValuesExports(
    await run(readExample("minimal.squiggle"))
  );
  if (!found.spec.ok) throw new Error(found.spec.value);
  const spec = found.spec.value;
  const evaluator = await ModelEvaluator.fromSpec(spec);
  if (!evaluator.ok) throw new Error(evaluator.value);
  const bundle: RelativeValuesBundle = await createRelativeValuesBundle({
    definition: spec.definition,
    evaluator: evaluator.value,
    meta: { variableName: "fruit" },
  });
  return { spec, evaluator: evaluator.value, bundle };
}

// Server-side rendering: effects don't run, so this checks the first render.
describe("dashboard rendering", () => {
  test("bundle dashboard with customizations", async () => {
    const { bundle } = await setup();
    const html = renderToStaticMarkup(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        className="my-dashboard"
        height={500}
        tabs={[
          "grid",
          "list",
          {
            id: "count",
            label: "Item count",
            render: ({ items }) => <p>{items.length} items</p>,
          },
        ]}
        initialTab="list"
        renderItemName={(item) => (
          <a href={`/fruit/${item.id}`}>{item.name.toUpperCase()}</a>
        )}
        clusterOverrides={{}}
      />
    );
    expect(html).toMatch(
      /^<div class="squiggle-rv my-dashboard" style="height:500px">/
    );
    // Tabs in the given order.
    const grid = html.indexOf(">Grid<");
    const list = html.indexOf(">List<");
    const count = html.indexOf(">Item count<");
    expect(grid).toBeGreaterThan(0);
    expect(list).toBeGreaterThan(grid);
    expect(count).toBeGreaterThan(list);
    expect(html).not.toContain(">Plot<");
    // Custom item names in the list view.
    expect(html).toContain('<a href="/fruit/banana">BANANA</a>');
    // Precomputed, so no progress bar.
    expect(html).not.toContain("data-rv-computing");
  });

  test("custom tab", async () => {
    const { bundle } = await setup();
    const html = renderToStaticMarkup(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        tabs={[
          {
            id: "count",
            label: "Item count",
            render: ({ items, evaluator }) => (
              <p>
                {items.length} items, live: {String(evaluator.canCompute)}
              </p>
            ),
          },
        ]}
      />
    );
    expect(html).toContain("<p>3 items, live: false</p>");
  });

  test("tab ids are typed", async () => {
    const { bundle } = await setup();
    const tabs: string[] = [];
    const element = (
      <RelativeValuesBundleDashboard
        bundle={bundle}
        tabs={["grid", { id: "ranking", label: "Ranking", render: () => null }]}
        initialTab="ranking"
        onTabChange={(tab) => {
          const typed: "list" | "grid" | "plot" | "ranking" = tab;
          tabs.push(typed);
        }}
      />
    );
    expect(renderToStaticMarkup(element)).toContain(">Ranking<");
    const invalid = (
      <RelativeValuesBundleDashboard
        bundle={bundle}
        // @ts-expect-error: unknown tab id
        initialTab="nope"
      />
    );
    expect(invalid).toBeTruthy();
  });

  test("invalid bundle", () => {
    const html = renderToStaticMarkup(
      <RelativeValuesBundleDashboard bundle={{ version: 1 }} />
    );
    expect(html).toContain("Invalid relative values bundle");
  });

  test("live evaluator shows progress until pairs are computed", async () => {
    const { spec } = await setup();
    const fresh = await ModelEvaluator.fromSpec(spec);
    if (!fresh.ok) throw new Error(fresh.value);
    const evaluator = fresh.value;
    const html = renderToStaticMarkup(
      <RelativeValuesDashboard
        definition={spec.definition}
        evaluator={evaluator}
      />
    );
    expect(html).toContain("data-rv-computing");
    expect(html).toContain("Computing comparisons");

    await evaluator.computeAll(spec.definition.items.map((item) => item.id));
    const ready = renderToStaticMarkup(
      <RelativeValuesDashboard
        definition={spec.definition}
        evaluator={evaluator}
        clusterOverrides={{}}
      />
    );
    expect(ready).not.toContain("data-rv-computing");
    expect(ready).toContain("banana");
  });

  test("cluster overrides", async () => {
    const { bundle } = await setup();
    const withClusters: RelativeValuesBundle = {
      ...bundle,
      definition: {
        ...bundle.definition,
        items: bundle.definition.items.map((item) => ({
          ...item,
          clusterId: "fruit",
        })),
        clusters: [{ id: "fruit", name: "Fruit", color: "#ff0000" }],
      },
    };
    const html = renderToStaticMarkup(
      <RelativeValuesBundleDashboard
        bundle={withClusters}
        clusterOverrides={{ fruit: { name: "Tasty fruit", color: "#00ff00" } }}
      />
    );
    expect(html).toContain("Tasty fruit");
    expect(html).toContain("#00ff00");
    expect(html).not.toContain("#ff0000");
  });
});
