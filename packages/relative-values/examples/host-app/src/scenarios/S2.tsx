import { FC, useState } from "react";

import {
  RelativeValuesBundleDashboard,
  RelativeValuesSingleView,
  type RelativeValuesState,
} from "@quri/squiggle-relative-values";

import { portfolioBundle } from "../portfolio.js";
import { ownerById } from "./hostData.js";
import { Scenario, ScenarioPage } from "./Scenario.js";

const TopN: FC = () => {
  const [limit, setLimit] = useState<number | null>(10);
  return (
    <Scenario
      id="S2"
      variant="top10"
      title="Top N by value, in units of SSO"
      description="One ranked table. The host's select drives `limit`; the unit, sort and limit are fixed (controlled without a change handler), so their controls are hidden."
      controls={
        <label>
          Show{" "}
          <select
            data-host-limit=""
            value={limit ?? "all"}
            onChange={(e) =>
              setLimit(e.target.value === "all" ? null : Number(e.target.value))
            }
          >
            <option value="5">top 5</option>
            <option value="10">top 10</option>
            <option value="all">all</option>
          </select>
        </label>
      }
      code={`<RelativeValuesSingleView bundle={bundle} view="list"
  state={{ unit: "sso", sort: { mode: "median", desc: true }, limit }}
  display={{ list: { groupByCluster: false } }} />`}
    >
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view="list"
        state={{ unit: "sso", sort: { mode: "median", desc: true }, limit }}
        display={{ list: { groupByCluster: false } }}
      />
    </Scenario>
  );
};

const TopNResortable: FC = () => {
  const [sort, setSort] = useState<RelativeValuesState["sort"]>({
    mode: "default",
    desc: false,
  });
  return (
    <Scenario
      id="S2"
      variant="limitBy"
      title="The 6 most valuable, re-sortable"
      description={
        <>
          `limitBy` picks the 6; `sort` only orders them, so sorting by name in
          Table Settings keeps the same 6. Current sort:{" "}
          <code data-host-sort="">
            {sort.desc ? "-" : ""}
            {sort.mode}
          </code>
        </>
      }
      code={`<RelativeValuesSingleView bundle={bundle} view="list"
  state={{ unit: "sso", limit: 6, limitBy: { mode: "median", desc: true }, sort }}
  onStateChange={(next) => setSort(next.sort)}
  locked={["unit", "limit", "limitBy"]}
  display={{ list: { groupByCluster: false } }} />`}
    >
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view="list"
        state={{
          unit: "sso",
          limit: 6,
          limitBy: { mode: "median", desc: true },
          sort,
        }}
        onStateChange={(next) => setSort(next.sort)}
        locked={["unit", "limit", "limitBy"]}
        display={{ list: { groupByCluster: false } }}
      />
    </Scenario>
  );
};

export const S2: FC = () => (
  <ScenarioPage
    id="s2"
    title="Subsets and top N"
    intro="`scope` fixes the universe (the user can't widen it; it bounds menus and computation). State keys (`ids`, `clusters`, `search`, `limit`) are filters the user may change, or the host may fix."
  >
    <Scenario
      id="S2"
      variant="scope-cluster"
      title="Only the Platform cluster"
      code={`<RelativeValuesBundleDashboard bundle={bundle} scope={{ clusters: ["platform"] }} />`}
    >
      <RelativeValuesBundleDashboard
        bundle={portfolioBundle}
        scope={{ clusters: ["platform"] }}
      />
    </Scenario>
    <Scenario
      id="S2"
      variant="scope-predicate"
      title="The Data team's initiatives (a host predicate)"
      description="`scope.where` uses host data that the model doesn't have (owners); it doesn't need to be memoized."
      code={`<RelativeValuesBundleDashboard bundle={bundle}
  scope={{ where: (item) => ownerById[item.id] === "Data team" }} tabs={["grid", "list"]} />`}
    >
      <RelativeValuesBundleDashboard
        bundle={portfolioBundle}
        scope={{ where: (item) => ownerById[item.id] === "Data team" }}
        tabs={["grid", "list"]}
      />
    </Scenario>
    <Scenario
      id="S2"
      variant="search"
      title="A seeded search and cluster filter"
      description="Initial values only: the user can clear the search or change the clusters."
      code={`<RelativeValuesBundleDashboard bundle={bundle}
  defaultState={{ clusters: ["enterprise", "retention"], search: "ing" }} />`}
    >
      <RelativeValuesBundleDashboard
        bundle={portfolioBundle}
        defaultState={{ clusters: ["enterprise", "retention"], search: "ing" }}
      />
    </Scenario>
    <TopN />
    <TopNResortable />
    <Scenario
      id="S2"
      variant="empty"
      title="Nothing matches"
      description="The `Empty` slot (reason: filter), here replaced by the host."
      code={`<RelativeValuesSingleView bundle={bundle} view="grid" state={{ ids: ["retired"] }}
  components={{ Empty: ({ reason }) => <p className="acme-empty">…</p> }} />`}
    >
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view="grid"
        state={{ ids: ["retiredInitiative"] }}
        components={{
          Empty: ({ reason }) => (
            <p className="acme-empty" data-host-content="">
              No initiatives to compare ({reason}).
            </p>
          ),
        }}
      />
    </Scenario>
  </ScenarioPage>
);
