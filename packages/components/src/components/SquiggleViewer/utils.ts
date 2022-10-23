import { DistributionChartSettings } from "../DistributionChart";
import { FunctionChartSettings } from "../FunctionChart";
import { SqValueLocation } from "@quri/squiggle-lang";

export type LocalItemSettings = {
  collapsed: boolean;
  distributionChartSettings?: Partial<DistributionChartSettings>;
  functionChartSettings?: Partial<FunctionChartSettings>;
  chartHeight?: number;
};

export type MergedItemSettings = {
  distributionChartSettings: DistributionChartSettings;
  functionChartSettings: FunctionChartSettings;
  chartHeight: number;
};

export const locationAsString = (location: SqValueLocation) =>
  location.path.items.join(".");
