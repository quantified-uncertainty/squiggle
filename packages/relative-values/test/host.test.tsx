import { describe, expect, test } from "@jest/globals";
import { FC, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  ModelEvaluator,
  RelativeValuesBundleDashboard,
  RelativeValuesProvider,
  RelativeValuesSingleView,
  useRelativeValues,
} from "../src/index.js";
import { readPortfolioBundle } from "./portfolio.js";

const bundle = readPortfolioBundle();
const count = (html: string, needle: string) => html.split(needle).length - 1;

// Server-side rendering: effects don't run, so this checks the first render.
describe("host control (SSR)", () => {
  test("controls={false} renders no toolbar, header or tab bar", () => {
    const html = renderToStaticMarkup(
      <RelativeValuesBundleDashboard bundle={bundle} controls={false} />
    );
    expect(html).not.toContain('data-rv-part="toolbar"');
    expect(html).not.toContain('data-rv-part="header"');
    expect(html).not.toContain('data-rv-part="tab-bar"');
    expect(html).not.toContain("Table Settings");
    expect(html).not.toContain("data-rv-compass");
    expect(count(html, 'data-rv-part="list-row"')).toBe(15);
  });

  test("a single view has no tab bar or title", () => {
    const html = renderToStaticMarkup(
      <RelativeValuesSingleView bundle={bundle} view="grid" />
    );
    expect(html).toMatch(/^<div class="squiggle-rv"/);
    expect(html).toContain('data-rv-part="grid"');
    expect(html).not.toContain('data-rv-part="tab-bar"');
    expect(html).not.toContain("Q3 initiative portfolio");
    expect(html).toContain("Row Settings");
  });

  test("limit renders exactly that many list rows, ranked by value", () => {
    const html = renderToStaticMarkup(
      <RelativeValuesSingleView
        bundle={bundle}
        view="list"
        state={{ unit: "sso", sort: { mode: "median", desc: true }, limit: 2 }}
        display={{ list: { groupByCluster: false } }}
      />
    );
    expect(count(html, 'data-rv-part="list-row"')).toBe(2);
    expect(count(html, 'data-rv-part="list-table"')).toBe(1);
    // Fixed unit: no unit pickers.
    expect(html).not.toContain("data-rv-compass");
    expect(html).toContain('data-rv-unit="sso"');
  });

  test("labels are overridden", () => {
    const html = renderToStaticMarkup(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        labels={{
          "tab.list": "Liste",
          "list.tableSettings": "Réglages",
          "list.searchPlaceholder": "Filtrer…",
        }}
      />
    );
    expect(html).toContain(">Liste<");
    expect(html).toContain(">Réglages<");
    expect(html).toContain('placeholder="Filtrer…"');
    expect(html).not.toContain(">List<");
  });

  test('display.grid.cell: "value" renders no "om"', () => {
    const withUncertainty = renderToStaticMarkup(
      <RelativeValuesSingleView bundle={bundle} view="grid" />
    );
    expect(withUncertainty).toContain(">om<");
    const html = renderToStaticMarkup(
      <RelativeValuesSingleView
        bundle={bundle}
        view="grid"
        display={{ grid: { cell: "value" } }}
      />
    );
    expect(html).not.toContain(">om<");
  });

  test("format: factor uncertainty and a custom number format", () => {
    const html = renderToStaticMarkup(
      <RelativeValuesSingleView
        bundle={bundle}
        view="list"
        format={{
          uncertainty: "factor",
          formatNumber: (n, { kind }) =>
            kind === "median" ? `<${n.toFixed(1)}>` : undefined,
        }}
      />
    );
    expect(html).toContain("×/÷");
    expect(html).not.toContain(">om<");
    expect(html).toContain("&lt;1.0&gt;");
  });

  test("scope excludes items", () => {
    const html = renderToStaticMarkup(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        scope={{ clusters: ["platform"], exclude: ["ciSpeedup"] }}
      />
    );
    expect(count(html, 'data-rv-part="list-row"')).toBe(3);
    expect(html).not.toContain('data-rv-item="ciSpeedup"');
    expect(html).not.toContain('data-rv-item="sso"');
  });

  test("an empty filter shows the Empty slot", () => {
    const html = renderToStaticMarkup(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        defaultState={{ search: "no such initiative" }}
        components={{
          Empty: ({ reason }) => <p className="empty">{reason}</p>,
        }}
      />
    );
    expect(html).toContain('<p class="empty">filter</p>');
  });

  test("themeClassName and compact density appear on the root", () => {
    const html = renderToStaticMarkup(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        themeClassName="acme-rv"
        display={{ density: "compact" }}
      />
    );
    expect(html).toMatch(
      /^<div class="squiggle-rv acme-rv squiggle-rv-compact"/
    );
  });

  test("slots get the default implementation", () => {
    const html = renderToStaticMarkup(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        components={{
          TabBar: ({ tabs, active }) => (
            <nav className="acme-tabs">
              {tabs
                .map((t) => `${t.id}${t.id === active ? "*" : ""}`)
                .join(",")}
            </nav>
          ),
          Toolbar: ({ children, view }) => (
            <div className={`acme-toolbar-${view}`}>
              {children}
              <button type="button">Export</button>
            </div>
          ),
        }}
      />
    );
    expect(html).toContain('<nav class="acme-tabs">list*,grid,plot</nav>');
    expect(html).toContain('class="acme-toolbar-list"');
    expect(html).toContain(">Export<");
  });

  test("custom single view and headless hook", () => {
    const TopThree = () => {
      const rv = useRelativeValues({
        overrides: { sort: { mode: "median", desc: true }, limit: 3 },
      });
      return (
        <ol data-status={rv.status}>
          {rv.rows.map((row) => (
            <li key={row.item.id}>
              {row.item.id}={row.value ? rv.format.value(row.value) : "?"}
            </li>
          ))}
        </ol>
      );
    };
    const html = renderToStaticMarkup(
      <RelativeValuesProvider
        bundle={bundle}
        defaultState={{ unit: "ciSpeedup" }}
      >
        <TopThree />
        <RelativeValuesSingleView
          view={{
            id: "count",
            label: "Count",
            requires: "none",
            render: (ctx) => (
              <p>
                {ctx.items.length} items in units of {ctx.unit?.id}
              </p>
            ),
          }}
        />
      </RelativeValuesProvider>
    );
    expect(count(html, "<li>")).toBe(3);
    expect(html).toContain('data-status="ready"');
    expect(html).toContain("<p>15 items in units of ciSpeedup</p>");
  });

  test("live mode renders the fallback until pairs are computed", async () => {
    const live = await ModelEvaluator.create(
      `spec = { values: { a: 1, b: 2 to 5, c: 3 to 8 } }`,
      "spec"
    );
    if (!live.ok) throw new Error(live.value);
    const definition = {
      title: "Live",
      items: ["a", "b", "c"].map((id) => ({
        id,
        name: id.toUpperCase(),
        clusterId: null,
        description: "",
      })),
      clusters: [],
    };
    const html = renderToStaticMarkup(
      <RelativeValuesSingleView
        definition={definition}
        evaluator={live.value}
        view="grid"
        fallback={<p className="loading">Loading…</p>}
      />
    );
    expect(html).toContain('<p class="loading">Loading…</p>');
    // Hub's composition: no precompute, values while rendering.
    const sync = renderToStaticMarkup(
      <RelativeValuesProvider definition={definition} evaluator={live.value}>
        <RelativeValuesSingleView view="grid" />
      </RelativeValuesProvider>
    );
    expect(sync).not.toContain("data-rv-computing");
    expect(count(sync, 'data-rv-part="grid-cell"')).toBe(9);
  });
});

// Moved here: the plots need a canvas, which jsdom lacks.
describe("host control: plot and toolbar (SSR)", () => {
  test("the Toolbar slot is rendered in every view, also without built-in controls", () => {
    const Toolbar: FC<{ view: string; children: ReactNode }> = ({
      view,
      children,
    }) => (
      <div data-host-toolbar={view}>
        {children}
        <button type="button">Export</button>
      </div>
    );
    for (const view of ["list", "grid", "plot"] as const) {
      const html = renderToStaticMarkup(
        <RelativeValuesSingleView
          bundle={bundle}
          view={view}
          components={{ Toolbar }}
          controls={{
            list: { settings: false, search: false },
            grid: {
              rowSettings: false,
              columnSettings: false,
              clusterDiagram: false,
              modeControls: false,
            },
          }}
        />
      );
      expect(html).toContain(`data-host-toolbar="${view}"`);
    }
    // No slot: the plot has no toolbar; controls={false}: no slot either.
    expect(
      renderToStaticMarkup(
        <RelativeValuesSingleView bundle={bundle} view="plot" />
      )
    ).not.toContain('data-rv-part="toolbar"');
    expect(
      renderToStaticMarkup(
        <RelativeValuesSingleView
          bundle={bundle}
          view="plot"
          controls={false}
          components={{ Toolbar }}
        />
      )
    ).not.toContain("data-host-toolbar");
  });
  const sections = (html: string) =>
    [...html.matchAll(/data-rv-plot-section="(\w+)"/g)].map((m) => m[1]);

  test("display.plot.plots sets the order; [] shows no plot and no panel", () => {
    const html = (plots: ("similarity" | "valueUncertainty")[]) =>
      renderToStaticMarkup(
        <RelativeValuesSingleView
          bundle={bundle}
          view="plot"
          display={{ plot: { plots } }}
        />
      );
    expect(sections(html(["valueUncertainty", "similarity"]))).toEqual([
      "valueUncertainty",
      "similarity",
    ]);
    expect(sections(html(["similarity", "valueUncertainty"]))).toEqual([
      "similarity",
      "valueUncertainty",
    ]);
    const empty = html([]);
    expect(sections(empty)).toEqual([]);
    expect(empty).not.toContain('data-rv-part="cluster-filter"');
    expect(empty).not.toContain("<canvas");
  });
});
