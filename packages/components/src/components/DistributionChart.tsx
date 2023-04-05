import { SqDistribution } from "@quri/squiggle-lang";
import * as React from "react";
import {
  MultiDistributionChart,
  MultiDistributionChartProps,
} from "./MultiDistributionChart/index.js";

export { type DistributionChartSettings } from "./MultiDistributionChart/index.js";

export type DistributionChartProps = Omit<
  MultiDistributionChartProps,
  "plot"
> & {
  distribution: SqDistribution;
};

export const DistributionChart: React.FC<DistributionChartProps> = ({
  distribution,
  environment,
  height,
  settings,
}) => {
  return (
    <MultiDistributionChart
      plot={{
        distributions: [
          { name: "default", distribution: distribution, opacity: 1 },
        ],
        showLegend: false,
        colorScheme: "blues",
      }}
      environment={environment}
      height={height}
      settings={settings}
    />
  );
};
