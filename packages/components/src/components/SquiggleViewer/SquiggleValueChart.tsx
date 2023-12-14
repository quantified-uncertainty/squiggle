import { memo } from "react";

import { SqBoxedValue } from "../../../../squiggle-lang/src/public/SqValue/index.js";
import { SqValueWithContext } from "../../lib/utility.js";
import { widgetRegistry } from "../../widgets/registry.js";
import { PlaygroundSettings } from "../PlaygroundSettings.js";

export const SquiggleValueChart = memo<{
  value: SqValueWithContext;
  settings: PlaygroundSettings;
  boxed?: SqBoxedValue;
}>(function SquiggleValueChart({ value, settings, boxed }) {
  const widget = widgetRegistry.widgets.get(value.tag);
  if (!widget) {
    return value.toString();
  }

  return <widget.Chart value={value} settings={settings} boxed={boxed} />;
});
