import React, { FC } from "react";

import { SqValueWithContext } from "../../lib/utility.js";
import { widgetRegistry } from "../../widgets/registry.js";

export const SquiggleValuePreviewRightSide: FC<{
  value: SqValueWithContext;
}> = ({ value }) => {
  const widget = widgetRegistry.widgets.get(value.tag);
  if (!widget?.PreviewRightSide) {
    return null;
  }

  return <widget.PreviewRightSide value={value} />;
};
