import { ValueViewer } from "../SquiggleViewer/ValueViewer.js";
import { SqTypeWithCount } from "./SqTypeWithCount.js";
import { widgetRegistry } from "./registry.js";

widgetRegistry.register("Array", {
  heading: (value) => `List(${value.value.getValues().length})`,
  renderPreview: (value) => (
    <SqTypeWithCount type="[]" count={value.value.getValues().length} />
  ),
  render: (value) => (
    <div className="space-y-2 pt-1 mt-1">
      {value.value.getValues().map((r, i) => (
        <ValueViewer key={i} value={r} />
      ))}
    </div>
  ),
});
