import { clsx } from "clsx";

import { NumberShower } from "../NumberShower.js";
import { widgetRegistry } from "./registry.js";
import { leftWidgetMargin } from "./utils.js";

widgetRegistry.register("Number", {
  renderPreview: (value) => <NumberShower precision={4} number={value.value} />,
  render: (value) => (
    <div className={clsx("font-semibold text-indigo-800", leftWidgetMargin)}>
      <NumberShower precision={4} number={value.value} />
    </div>
  ),
});
