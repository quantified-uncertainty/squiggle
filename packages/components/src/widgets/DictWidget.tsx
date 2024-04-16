import { useMemo } from "react";

import { nonHiddenDictEntries } from "../components/SquiggleViewer/utils.js";
import { ValueViewer } from "../components/SquiggleViewer/ValueViewer/index.js";
import { widgetRegistry } from "./registry.js";
import { SqTypeWithCount } from "./SqTypeWithCount.js";

widgetRegistry.register("Dict", {
  heading: (value) => `Dict(${nonHiddenDictEntries(value.value).length})`,
  Preview: (value) => (
    <SqTypeWithCount
      type="{}"
      count={nonHiddenDictEntries(value.value).length}
    />
  ),
  Chart: (value) => {
    const entries = useMemo(() => nonHiddenDictEntries(value.value), [value]);
    return (
      <div className="mt-0.5 space-y-1 pt-0.5">
        {entries.map(([k, v]) => (
          <ValueViewer parentValue={value} key={k} value={v} />
        ))}
      </div>
    );
  },
});
