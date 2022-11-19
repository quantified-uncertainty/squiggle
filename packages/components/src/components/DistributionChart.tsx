import * as React from "react";
import { SqDistribution } from "@quri/squiggle-lang";
import {
  MultiDistributionChart,
  MultiDistributionChartProps,
} from "./MultiDistributionChart";

export { DistributionChartSettings } from "./MultiDistributionChart";

export type DistributionChartProps = Omit<
  MultiDistributionChartProps,
  "plot"
> & {
  distribution: SqDistribution;
};

export const DistributionChart: React.FC<DistributionChartProps> = ({
  distribution,
  environment,
  chartHeight,
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
      chartHeight={chartHeight}
      settings={settings}
    />
  );
};
