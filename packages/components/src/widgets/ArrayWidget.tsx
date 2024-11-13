import { useMemo } from "react";

import { SqStringValue, SqValue } from "@quri/squiggle-lang";
import { DocumentTextIcon } from "@quri/ui";

import { vString } from "../../../squiggle-lang/src/value/VString.js";
import { ValueViewer } from "../components/SquiggleViewer/ValueViewer/index.js";
import { SqValueWithContext } from "../lib/utility.js";
import { widgetRegistry } from "./registry.js";
import { SqTypeWithCount } from "./SqTypeWithCount.js";

function isNotebook(value: SqValueWithContext) {
  return Boolean(value.tags.notebook());
}

// Combines adjacent string values into a single string value. Helps with rendering in notebooks, so that there aren't unecessary breaks between strings.
const compressStringValues = (values: SqValue[]): SqValue[] => {
  return values.reduce((acc: SqValue[], curr) => {
    // If current and previous are strings, combine them
    if (
      curr.tag === "String" &&
      acc.length > 0 &&
      acc[acc.length - 1].tag === "String"
    ) {
      acc[acc.length - 1] = new SqStringValue(
        vString(acc[acc.length - 1].value + "\n" + curr.value),
        acc[acc.length - 1].context
      );
      return acc;
    }
    // Otherwise add the current value as is
    return [...acc, curr];
  }, []);
};

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

    const compressedValues = useMemo(() => {
      if (!isNotebook(value)) return values;
      return compressStringValues(values);
    }, [values, value]);

    return (
      <div className="mt-0.5 space-y-1 pt-0.5">
        {compressedValues.map((r, i) => (
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
