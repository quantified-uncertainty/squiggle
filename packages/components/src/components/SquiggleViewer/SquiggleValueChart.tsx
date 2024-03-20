import { memo } from "react";

import { SqValueWithContext, valueHasContext } from "../../lib/utility.js";
import { widgetRegistry } from "../../widgets/registry.js";
import { PlaygroundSettings } from "../PlaygroundSettings.js";

function showAsValue(
  value: SqValueWithContext
): SqValueWithContext | undefined {
  if (value.tags.showAs()) {
    const _showAs = value.tags.showAs();
    const _withContext = valueHasContext(_showAs!);
    return _withContext ? _showAs : undefined;
  } else if (value.tags.specification()) {
    const _specification = value.tags.specification();
    const _showAs = _specification!.showAs(value, {
      sampleCount: 1000,
      xyPointLength: 1000,
      seed: "test-seed",
    });
    return _showAs.ok && valueHasContext(_showAs.value)
      ? _showAs.value
      : undefined;
  }
}

export const SquiggleValueChart = memo<{
  value: SqValueWithContext;
  settings: PlaygroundSettings;
}>(function SquiggleValueChart({ value, settings }) {
  const usedValue = showAsValue(value) || value;

  const widget = widgetRegistry.widgets.get(usedValue.tag);
  if (!widget) {
    return usedValue.toString();
  }

  return <widget.Chart value={usedValue} settings={settings} />;
});
