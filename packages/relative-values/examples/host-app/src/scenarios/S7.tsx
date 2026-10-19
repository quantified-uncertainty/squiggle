import { FC } from "react";

import { RelativeValuesSingleView } from "@quri/squiggle-relative-values";

import { portfolioBundle } from "../portfolio.js";
import { Scenario, ScenarioPage } from "./Scenario.js";

export const S7: FC = () => (
  <ScenarioPage
    id="s7"
    title="Plot options"
    intro="Which plots, their height and titles, the reference of the value / uncertainty plot, and its scales."
  >
    <Scenario
      id="S7"
      variant="value"
      title="Value and uncertainty only, in units of SSO"
      code={`<RelativeValuesSingleView bundle={bundle} view="plot" state={{ unit: "sso" }}
  controls={{ plot: { clusterFilter: false } }}
  display={{ plot: { plots: ["valueUncertainty"], height: 320, titles: false,
                     valueUncertainty: { reference: "unit", xScale: "log", yScale: "linear" } } }} />`}
    >
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view="plot"
        state={{ unit: "sso" }}
        controls={{ plot: { clusterFilter: false } }}
        display={{
          plot: {
            plots: ["valueUncertainty"],
            height: 320,
            titles: false,
            valueUncertainty: {
              reference: "unit",
              xScale: "log",
              yScale: "linear",
            },
          },
        }}
      />
    </Scenario>
    <Scenario
      id="S7"
      variant="similarity"
      title="The similarity map, with a selected item"
      description="`selectedItem` rings a dot; clicking a dot selects it (and calls onItemClick)."
      code={`<RelativeValuesSingleView bundle={bundle} view="plot"
  defaultState={{ selectedItem: "sso" }}
  display={{ plot: { plots: ["similarity"], height: 360 } }} />`}
    >
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view="plot"
        defaultState={{ selectedItem: "sso" }}
        display={{ plot: { plots: ["similarity"], height: 360 } }}
      />
    </Scenario>
    <Scenario
      id="S7"
      variant="linear"
      title="Average over all items, linear scales"
      code={`<RelativeValuesSingleView bundle={bundle} view="plot"
  display={{ plot: { plots: ["valueUncertainty"], height: 300,
    valueUncertainty: { reference: "average", xScale: "linear" } } }} />`}
    >
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view="plot"
        display={{
          plot: {
            plots: ["valueUncertainty"],
            height: 300,
            valueUncertainty: { reference: "average", xScale: "linear" },
          },
        }}
      />
    </Scenario>
  </ScenarioPage>
);
