import { clsx } from "clsx";
import { widgetRegistry } from "./registry.js";
import { leftWidgetMargin } from "./utils.js";

widgetRegistry.register("Bool", {
  Preview: (value) => value.value.toString(),
  Chart: (value) => (
    <div
      className={clsx(
        "text-indigo-800 text-sm font-mono font-semibold",
        leftWidgetMargin
      )}
    >
      {value.value.toString()}
    </div>
  ),
});
