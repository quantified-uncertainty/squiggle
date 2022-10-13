import { DistributionPlottingSettings } from "../DistributionChart";
import { FunctionChartSettings } from "../FunctionChart";
import { SqValueLocation, environment } from "@quri/squiggle-lang";

export type LocalItemSettings = {
  collapsed: boolean;
  distributionPlotSettings?: Partial<DistributionPlottingSettings>;
  chartSettings?: Partial<FunctionChartSettings>;
  chartHeight?: number;
  environment?: environment;
};

export type MergedItemSettings = {
  distributionPlotSettings: DistributionPlottingSettings;
  chartSettings: FunctionChartSettings;
  chartHeight: number;
  environment: environment;
};

export const locationAsString = (location: SqValueLocation) =>
  location.path.items.join(".");
