import { FC } from "react";

import {
  RelativeValuesClusterDiagram,
  RelativeValuesProvider,
  RelativeValuesRoot,
  RelativeValuesSingleView,
} from "@quri/squiggle-relative-values";

import { portfolioBundle } from "../portfolio.js";
import { Scenario, ScenarioPage } from "./Scenario.js";

export const S6: FC = () => (
  <ScenarioPage
    id="s6"
    title="Grid options"
    intro="Rows and columns, their order, full or half matrix, what a cell shows, and cluster grouping."
  >
    <Scenario
      id="S6"
      variant="half"
      title="Four items, half matrix, values only"
      description={`The scope fixes the items and their order; columns mirror the rows (columns: "rows"), so half mode is a true triangle.`}
      code={`<RelativeValuesSingleView bundle={bundle} view="grid"
  scope={{ ids: ["sso", "auditLog", "partnerApi", "dbMigration"] }}
  defaultState={{ columns: "rows", gridMode: "half" }}
  display={{ grid: { cell: "value", heatmap: false, cellWidth: 110 } }} />`}
    >
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view="grid"
        scope={{ ids: ["sso", "auditLog", "partnerApi", "dbMigration"] }}
        defaultState={{ columns: "rows", gridMode: "half" }}
        display={{ grid: { cell: "value", heatmap: false, cellWidth: 110 } }}
      />
    </Scenario>
    <Scenario
      id="S6"
      variant="bands"
      title="Research rows × the 5 most valuable columns"
      description="Rows are filtered to a cluster; the column axis is independent, ranked by value and limited to 5; cells show the full summary, grouped in cluster bands."
      code={`<RelativeValuesSingleView bundle={bundle} view="grid"
  defaultState={{ clusters: ["research"], sort: { mode: "cluster" },
                  columns: { sort: { mode: "median", desc: true }, limit: 5 } }}
  display={{ grid: { cell: "full", groupByCluster: true } }} />`}
    >
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view="grid"
        defaultState={{
          clusters: ["research"],
          sort: { mode: "cluster" },
          columns: { sort: { mode: "median", desc: true }, limit: 5 },
        }}
        display={{ grid: { cell: "full", groupByCluster: true } }}
      />
    </Scenario>
    <Scenario
      id="S6"
      variant="explicit"
      title="Explicit rows and columns"
      description="`ids` picks (and orders) the rows, `columns.ids` the columns; the user can still sort and filter."
      code={`<RelativeValuesSingleView bundle={bundle} view="grid"
  defaultState={{ ids: ["usageBilling", "partnerApi", "pricingExperiment"],
                  columns: { ids: ["sso", "onboardingRevamp", "ciSpeedup", "forecastingModel"] } }} />`}
    >
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view="grid"
        defaultState={{
          ids: ["usageBilling", "partnerApi", "pricingExperiment"],
          columns: {
            ids: ["sso", "onboardingRevamp", "ciSpeedup", "forecastingModel"],
          },
        }}
      />
    </Scenario>
    <Scenario
      id="S6"
      variant="clusters"
      title="The cluster-level matrix as the main view"
      code={`<RelativeValuesProvider bundle={bundle}>
  <RelativeValuesRoot><RelativeValuesClusterDiagram /></RelativeValuesRoot>
</RelativeValuesProvider>`}
    >
      <RelativeValuesProvider bundle={portfolioBundle}>
        <RelativeValuesRoot>
          <RelativeValuesClusterDiagram />
        </RelativeValuesRoot>
      </RelativeValuesProvider>
    </Scenario>
  </ScenarioPage>
);
