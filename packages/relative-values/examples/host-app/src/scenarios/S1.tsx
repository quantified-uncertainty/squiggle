import { FC } from "react";

import {
  RelativeValuesBundleDashboard,
  RelativeValuesSingleView,
} from "@quri/squiggle-relative-values";

import { portfolioBundle } from "../portfolio.js";
import { RankingTable } from "../RankingTab.js";
import { Scenario, ScenarioPage } from "./Scenario.js";

export const S1: FC = () => (
  <ScenarioPage
    id="s1"
    title="One view, no chrome"
    intro="Each block shows exactly one view: no title, no tab bar, and (with controls={false}) no toolbars, unit pickers or panels. Cells and item names stay clickable."
  >
    <Scenario
      id="S1"
      variant="grid"
      title="Just the grid"
      description="A static matrix, e.g. for a report."
      code={`<RelativeValuesSingleView bundle={bundle} view="grid" controls={false} />`}
    >
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view="grid"
        controls={false}
        height={360}
      />
    </Scenario>
    <Scenario
      id="S1"
      variant="list"
      title="Just the list"
      code={`<RelativeValuesSingleView bundle={bundle} view="list" controls={false} />`}
    >
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view="list"
        controls={false}
        height={360}
      />
    </Scenario>
    <Scenario
      id="S1"
      variant="plot"
      title="Just the plot"
      code={`<RelativeValuesSingleView bundle={bundle} view="plot" controls={false} />`}
    >
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view="plot"
        controls={false}
        display={{ plot: { height: 300 } }}
      />
    </Scenario>
    <Scenario
      id="S1"
      variant="ranking"
      title="Just a custom view"
      description="A custom view gets the same context as a custom tab: rows ranked by value in units of SSO, with their values (only the 15 item × unit pairs are needed)."
      code={`<RelativeValuesSingleView
  bundle={bundle}
  view={{ id: "ranking", label: "Ranking", requires: "unit",
          render: (ctx) => <RankingTable rows={ctx.rows} unitName={ctx.unit?.name} /> }}
  state={{ unit: "sso", sort: { mode: "median", desc: true } }} // fixed
/>`}
    >
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view={{
          id: "ranking",
          label: "Ranking",
          requires: "unit",
          render: (ctx) => (
            <RankingTable rows={ctx.rows} unitName={ctx.unit?.name} />
          ),
        }}
        state={{ unit: "sso", sort: { mode: "median", desc: true } }}
      />
    </Scenario>
    <Scenario
      id="S1"
      variant="dashboard"
      title="A dashboard with one tab, no header"
      description="The dashboard preset can do this too: one tab, and the header row (title and tab bar) hidden."
      code={`<RelativeValuesBundleDashboard bundle={bundle} tabs={["plot"]}
  controls={{ header: false, tabs: false }} />`}
    >
      <RelativeValuesBundleDashboard
        bundle={portfolioBundle}
        tabs={["plot"]}
        controls={{ header: false, tabs: false }}
        display={{ plot: { plots: ["similarity"], height: 260 } }}
      />
    </Scenario>
  </ScenarioPage>
);
