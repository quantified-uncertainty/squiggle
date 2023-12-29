import { memo } from "react";

import { SqValueWithContext, valueHasContext } from "../../lib/utility.js";
import { widgetRegistry } from "../../widgets/registry.js";
import { PlaygroundSettings } from "../PlaygroundSettings.js";

export const SquiggleValueChart = memo<{
  value: SqValueWithContext;
  settings: PlaygroundSettings;
}>(function SquiggleValueChart({ value, settings }) {
  const showAs = value.tags.showAs();
  const usedValue = showAs && valueHasContext(showAs) ? showAs : value;

  const widget = widgetRegistry.widgets.get(usedValue.tag);
  if (!widget) {
    return usedValue.toString();
  }

  return <widget.Chart value={usedValue} settings={settings} />;
});
