import { useMemo } from "react";

import { ValueViewer } from "../components/SquiggleViewer/ValueViewer.js";
import { widgetRegistry } from "./registry.js";
import { SqTypeWithCount } from "./SqTypeWithCount.js";

widgetRegistry.register("Array", {
  heading: (value) => {
    const isNotebook = Boolean(value.tags.notebook());
    return !isNotebook ? `List(${value.value.getValues().length})` : "";
  },

  Preview: (value) => {
    const isNotebook = Boolean(value.tags.notebook());
    return !isNotebook ? (
      <SqTypeWithCount type="[]" count={value.value.getValues().length} />
    ) : (
      ""
    );
  },
  Chart: (value) => {
    const isNotebook = Boolean(value.tags.notebook());
    const values = useMemo(() => value.value.getValues(), [value]);
    return (
      <div className="space-y-1 pt-0.5 mt-0.5">
        {values.map((r, i) => (
          <ValueViewer
            parentValue={value}
            key={i}
            value={r}
            header={isNotebook ? "hide" : undefined}
          />
        ))}
      </div>
    );
  },
});
