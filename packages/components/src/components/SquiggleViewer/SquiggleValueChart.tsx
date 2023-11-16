import { FC } from "react";

import { SqValueWithContext } from "../../lib/utility.js";
import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { widgetRegistry } from "../widgets/registry.js";

export const SquiggleValueChart: FC<{
  value: SqValueWithContext;
  settings: PlaygroundSettings;
}> = ({ value, settings }) => {
  const widget = widgetRegistry.widgets.get(value.tag);
  if (!widget) {
    return value.toString();
  }

  return widget.render(value, settings);
};
