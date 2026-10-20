import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";

import * as rv from "../src/index.js";
import { readPortfolioBundle } from "./portfolio.js";

const bundle = readPortfolioBundle();

describe("server rendering", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test("imports without window or document", () => {
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
    expect(rv.RelativeValuesDashboard).toBeDefined();
  });

  test("every view and primitive renders in bundle mode, and leaves no timers", () => {
    jest.useFakeTimers();
    const html = renderToStaticMarkup(
      <rv.RelativeValuesProvider bundle={bundle}>
        <rv.RelativeValuesRoot>
          <rv.ListView />
          <rv.GridView />
          <rv.PlotView />
          <rv.ClusterFilter axis="rows" />
          <rv.RelativeValuesSearchBox />
          <rv.RelativeValuesSortMenu />
          <rv.RelativeValuesUnitPicker />
          <rv.RelativeValuesGridModeControls />
          <rv.RelativeValuesClusterDiagram />
          <rv.RelativeValuesPairDetails pair={["sso", "auditLog"]} />
          <rv.RelativeValuesProgressBar />
        </rv.RelativeValuesRoot>
      </rv.RelativeValuesProvider>
    );
    for (const part of [
      "list",
      "grid",
      "plot",
      "cluster-filter",
      "search",
      "sort-menu",
      "unit-picker",
      "grid-mode",
      "cluster-diagram",
      "sidebar",
    ]) {
      expect(html).toContain(`data-rv-part="${part}"`);
    }
    // Canvases render empty, at a fixed height.
    expect(html).toContain('<canvas class="w-full" style="height:450px"');
    expect(jest.getTimerCount()).toBe(0);
  });

  test("dashboards render every tab without timers", () => {
    jest.useFakeTimers();
    for (const tab of ["list", "grid", "plot"] as const) {
      const html = renderToStaticMarkup(
        <rv.RelativeValuesBundleDashboard bundle={bundle} initialTab={tab} />
      );
      expect(html).toContain(`data-rv-part="${tab}"`);
    }
    expect(jest.getTimerCount()).toBe(0);
  });
});
