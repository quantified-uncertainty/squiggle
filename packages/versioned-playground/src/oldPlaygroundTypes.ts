/*
 * Older playgrounds didn't export their props type, and it's not possible to import the type when we're doing lazy loading.
 * (Attempt to implicitly type the lazy import causes TS2742 "likely not portable" error.)
 * So we have to duplicate heir type definitions here.
 */

import { CSSProperties, ReactNode } from "react";

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

type PlaygroundSettings_0_8_5 = {
  environment: {
    sampleCount: number;
    xyPointLength: number;
  };
  distributionChartSettings: {
    xScale: "linear" | "log" | "symlog" | "exp";
    yScale: "linear" | "log" | "symlog" | "exp";
    showSummary: boolean;
    minX?: number | undefined;
    maxX?: number | undefined;
    title?: string | undefined;
  };
  functionChartSettings: {
    start: number;
    stop: number;
    count: number;
  };
  editorSettings: {
    lineWrapping: boolean;
  };
  chartHeight: number;
};

type RenderExtraControls = (props: {
  openModal: (name: string) => void;
}) => ReactNode;

export type SquigglePlaygroundProps_0_8_5 = {
  defaultCode?: string;
  onCodeChange?(code: string): void;
  onSettingsChange?(settings: PlaygroundSettings_0_8_5): void;
  height?: CSSProperties["height"];
  renderExtraControls?: RenderExtraControls;
  renderModal?: (modalName: string) =>
    | {
        title: string;
        body: ReactNode;
      }
    | undefined;
} & DeepPartial<PlaygroundSettings_0_8_5>;

export type SquigglePlaygroundProps_0_8_6 = SquigglePlaygroundProps_0_8_5 & {
  renderExtraDropdownItems?: RenderExtraControls;
};
