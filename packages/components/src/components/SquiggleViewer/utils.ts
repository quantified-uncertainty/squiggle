import { PlotSettings } from "../DistributionChart";
import { FunctionSettings } from "../FunctionChart";
import { environment } from "@quri/squiggle-lang";

export type LocalItemSettings = {
  collapsed: boolean;
  plotSettings?: Partial<PlotSettings>;
  functionSettings?: Partial<FunctionSettings>;
  height?: number;
  environment?: Partial<environment>;
};

export type MergedItemSettings = {
  plotSettings: PlotSettings;
  functionSettings: FunctionSettings;
  height: number;
  environment: environment;
};

export type Path = string[];

export const pathAsString = (path: Path) => path.join(".");
