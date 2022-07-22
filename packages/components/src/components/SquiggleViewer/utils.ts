import { DistributionPlottingSettings } from "../DistributionChart";
import { FunctionChartSettings } from "../FunctionChart";
import { environment } from "@quri/squiggle-lang";

export type LocalItemSettings = {
  collapsed: boolean;
  distributionPlotSettings?: Partial<DistributionPlottingSettings>;
  chartSettings?: Partial<FunctionChartSettings>;
  height?: number;
  environment?: Partial<environment>;
};

export type MergedItemSettings = {
  distributionPlotSettings: DistributionPlottingSettings;
  chartSettings: FunctionChartSettings;
  height: number;
  environment: environment;
};

export type Path = string[];

export const pathAsString = (path: Path) => path.join(".");
