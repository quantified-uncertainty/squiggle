import * as React from "react";
import { useSquiggle, SquiggleArgs } from "../lib/hooks/useSquiggle";
import {
  SquiggleViewer,
  FlattenedViewSettings,
  createViewSettings,
} from "./SquiggleViewer";
import { getValueToRender } from "../lib/utility";

export type SquiggleChartProps = SquiggleArgs & FlattenedViewSettings;

export const SquiggleChart: React.FC<SquiggleChartProps> = React.memo(
  (props) => {
    const resultAndBindings = useSquiggle(props);

    const valueToRender = getValueToRender(resultAndBindings);

    return (
      <SquiggleViewer {...createViewSettings(props)} result={valueToRender} />
    );
  }
);
