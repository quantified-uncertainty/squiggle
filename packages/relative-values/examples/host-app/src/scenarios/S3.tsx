import { FC, useEffect, useState } from "react";

import {
  type Item,
  RelativeValuesBundleDashboard,
  RelativeValuesSingleView,
} from "@quri/squiggle-relative-values";

import { portfolioBundle } from "../portfolio.js";
import { revenueById } from "./hostData.js";
import { Scenario, ScenarioPage } from "./Scenario.js";

const items: Item[] = portfolioBundle.definition.items;

const ControlledUnit: FC = () => {
  const [unit, setUnit] = useState<string | null>("sso");
  const unitName =
    items.find((item) => item.id === unit)?.name ?? "recommended";
  return (
    <Scenario
      id="S3"
      variant="controlled"
      title="A unit controlled by the host"
      description="The host owns `unit`: its select and the dashboard's compass icons both change it, through `onStateChange`."
      controls={
        <>
          <label>
            In units of{" "}
            <select
              data-host-unit=""
              value={unit ?? ""}
              onChange={(e) => setUnit(e.target.value || null)}
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>{" "}
          <output data-unit-readout="">unit: {unitName}</output>
        </>
      }
      code={`const [unit, setUnit] = useState<string | null>("sso");
<RelativeValuesSingleView bundle={bundle} view="list" state={{ unit }}
  onStateChange={(next, change) => change.keys.includes("unit") && setUnit(next.unit)}
  display={{ list: { groupByCluster: false } }} />`}
    >
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view="list"
        state={{ unit }}
        onStateChange={(next, change) => {
          if (change.keys.includes("unit")) {
            setUnit(next.unit);
          }
        }}
        display={{ list: { groupByCluster: false } }}
        height={420}
      />
    </Scenario>
  );
};

// Revenue comes from the host's API, after the dashboard is shown; the
// sort's compare function closes over it, so the order updates when it
// loads.
function useRevenue(): Record<string, number> | undefined {
  const [revenue, setRevenue] = useState<Record<string, number>>();
  useEffect(() => {
    const timeout = setTimeout(() => setRevenue(revenueById), 300);
    return () => clearTimeout(timeout);
  }, []);
  return revenue;
}

const CustomSort: FC = () => {
  const revenue = useRevenue();
  return (
    <Scenario
      id="S3"
      variant="custom-sort"
      title="A host-registered sort: revenue"
      description={
        <>
          `sorts` adds “Revenue” to the sort menus; `sortOptions` picks and
          orders the offered modes. The revenue figures load after the
          dashboard:{" "}
          <output data-host-revenue={revenue ? "loaded" : "loading"}>
            {revenue ? "loaded" : "loading…"}
          </output>
        </>
      }
      code={`const revenue = useRevenue(); // loads later
<RelativeValuesBundleDashboard bundle={bundle}
  sorts={{ revenue: { label: "Revenue",
    compare: (a, b) => (revenue?.[a.item.id] ?? 0) - (revenue?.[b.item.id] ?? 0) } }}
  defaultState={{ sort: { mode: "revenue", desc: true } }}
  controls={{ sortMenu: { sortOptions: ["median", "uncertainty", "name", "revenue"] } }}
  display={{ list: { groupByCluster: false } }} />`}
    >
      <RelativeValuesBundleDashboard
        bundle={portfolioBundle}
        sorts={{
          revenue: {
            label: "Revenue",
            compare: (a, b) =>
              (revenue?.[a.item.id] ?? 0) - (revenue?.[b.item.id] ?? 0),
          },
        }}
        defaultState={{ sort: { mode: "revenue", desc: true } }}
        controls={{
          sortMenu: {
            sortOptions: ["median", "uncertainty", "name", "revenue"],
          },
        }}
        display={{ list: { groupByCluster: false } }}
        renderItemName={(item) => (
          <span data-host-content="">
            {item.name}{" "}
            <span className="acme-revenue">
              {revenue ? `$${revenue[item.id]}k` : "…"}
            </span>
          </span>
        )}
        height={420}
      />
    </Scenario>
  );
};

export const S3: FC = () => (
  <ScenarioPage
    id="s3"
    title="Fixed or controlled unit and sort"
    intro="A controlled key without a change handler is fixed: its built-in controls are hidden. With a handler, the host decides what happens."
  >
    <Scenario
      id="S3"
      variant="fixed"
      title="Fixed: in units of SSO, sorted by name"
      description="No compass icons, no unit dropdowns, no “Sort by” section."
      code={`<RelativeValuesBundleDashboard bundle={bundle}
  state={{ unit: "sso", sort: { mode: "name", desc: false } }} />`}
    >
      <RelativeValuesBundleDashboard
        bundle={portfolioBundle}
        state={{ unit: "sso", sort: { mode: "name", desc: false } }}
        height={420}
      />
    </Scenario>
    <ControlledUnit />
    <CustomSort />
  </ScenarioPage>
);
