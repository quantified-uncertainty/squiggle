import { FC } from "react";
import { SqValueWithContext } from "../lib/utility.js";
import { PlaygroundSettings } from "./PlaygroundSettings.js";
import { getSqValueWidget } from "./SquiggleViewer/getSqValueWidget.js";

export const SquiggleValueChart: FC<{
  value: SqValueWithContext;
  settings: PlaygroundSettings;
}> = ({ value, settings }) => {
  const widget = getSqValueWidget(value.tag);
  return widget.render(value, settings);
};
