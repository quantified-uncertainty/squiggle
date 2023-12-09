import { clsx } from "clsx";
import { FC } from "react";

import { SqValueWithContext } from "../../lib/utility.js";
import { widgetRegistry } from "../../widgets/registry.js";

export const SquiggleValuePreview: FC<{
  value: SqValueWithContext;
}> = ({ value }) => {
  const widget = widgetRegistry.widgets.get(value.tag);
  if (!widget?.Preview) {
    return null;
  }

  return <widget.Preview value={value} />;
};
