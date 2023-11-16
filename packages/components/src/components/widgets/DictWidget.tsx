import { ValueViewer } from "../SquiggleViewer/ValueViewer.js";
import { SqTypeWithCount } from "./SqTypeWithCount.js";
import { widgetRegistry } from "./registry.js";

widgetRegistry.register("Dict", {
  heading: (value) => `Dict(${value.value.entries().length})`,
  renderPreview: (value) => (
    <SqTypeWithCount type="{}" count={value.value.entries().length} />
  ),
  render: (value) => (
    <div className="space-y-2 pt-1 mt-1">
      {value.value.entries().map(([k, v]) => (
        <ValueViewer key={k} value={v} />
      ))}
    </div>
  ),
});
