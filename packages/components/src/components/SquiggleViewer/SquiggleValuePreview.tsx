import { clsx } from "clsx";
import { FC } from "react";

import { SqValueWithContext } from "../../lib/utility.js";
import { widgetRegistry } from "../../widgets/registry.js";

export const SquiggleValuePreview: FC<{
  value: SqValueWithContext;
  isOpen: boolean;
}> = ({ value, isOpen }) => {
  const widget = widgetRegistry.widgets.get(value.tag);
  if (!widget?.Preview) {
    return null;
  }

  return (
    <div
      className={clsx(
        "ml-3 text-sm text-blue-800",
        isOpen ? "opacity-40" : "opacity-60"
      )}
    >
      <widget.Preview value={value} />
    </div>
  );
};