import { useMemo } from "react";

import { ValueViewer } from "../components/SquiggleViewer/ValueViewer.js";
import { widgetRegistry } from "./registry.js";
import { SqTypeWithCount } from "./SqTypeWithCount.js";

widgetRegistry.register("Dict", {
  heading: (value) => `Dict(${value.value.entries().length})`,
  Preview: (value) => (
    <SqTypeWithCount type="{}" count={value.value.entries().length} />
  ),
  Chart: (value) => {
    const entries = useMemo(() => value.value.entries(), [value]);
    return (
      <div className="space-y-2 pt-1 mt-1">
        {entries.map(([k, v]) => (
          <ValueViewer key={k} value={v} />
        ))}
      </div>
    );
  },
});
