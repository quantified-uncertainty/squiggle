import { useMemo } from "react";

import { DocumentTextIcon } from "@quri/ui";

import { ValueViewer } from "../components/SquiggleViewer/ValueViewer.js";
import { SqValueWithContext } from "../lib/utility.js";
import { widgetRegistry } from "./registry.js";
import { SqTypeWithCount } from "./SqTypeWithCount.js";

function isNotebook(value: SqValueWithContext) {
  return Boolean(value.tags.notebook());
}

widgetRegistry.register("Array", {
  heading: (value) => `List(${value.value.getValues().length})`,

  Preview: (value) => {
    return isNotebook(value) ? (
      <DocumentTextIcon size={14} className="opacity-40" />
    ) : (
      <SqTypeWithCount type="[]" count={value.value.getValues().length} />
    );
  },
  Chart: (value) => {
    const values = useMemo(() => value.value.getValues(), [value]);
    return (
      <div className="space-y-1 pt-0.5 mt-0.5">
        {values.map((r, i) => (
          <ValueViewer
            parentValue={value}
            key={i}
            value={r}
            header={isNotebook(value) ? "hide" : undefined}
          />
        ))}
      </div>
    );
  },
});
