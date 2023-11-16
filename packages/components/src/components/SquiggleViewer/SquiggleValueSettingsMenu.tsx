import { FC } from "react";

import { SqValueWithContext } from "../../lib/utility.js";
import { widgetRegistry } from "../../widgets/registry.js";

export const SquiggleValueSettingsMenu: FC<{
  value: SqValueWithContext;
  onChange: () => void;
}> = ({ value, onChange }) => {
  const widget = widgetRegistry.widgets.get(value.tag);

  if (!widget?.Menu) {
    return null;
  }
  return <widget.Menu value={value} params={{ onChange }} />;
};
