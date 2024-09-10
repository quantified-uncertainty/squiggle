import React, { FC } from "react";

import { SqValueWithContext } from "../../lib/utility.js";
import { widgetRegistry } from "../../widgets/registry.js";

export const SquiggleValueGraph: FC<{
  value: SqValueWithContext;
}> = ({ value }) => {
  const widget = widgetRegistry.widgets.get(value.tag);
  if (!widget?.Graph) {
    return null;
  }

  return <widget.Graph value={value} />;
};
