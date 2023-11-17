import { useMemo } from "react";
import { ValueViewer } from "../components/SquiggleViewer/ValueViewer.js";
import { SqTypeWithCount } from "./SqTypeWithCount.js";
import { widgetRegistry } from "./registry.js";

widgetRegistry.register("Array", {
  heading: (value) => `List(${value.value.getValues().length})`,
  Preview: (value) => (
    <SqTypeWithCount type="[]" count={value.value.getValues().length} />
  ),
  Chart: (value) => {
    const values = useMemo(() => value.value.getValues(), [value]);
    return (
      <div className="space-y-2 pt-1 mt-1">
        {values.map((r, i) => (
          <ValueViewer key={i} value={r} />
        ))}
      </div>
    );
  },
});
