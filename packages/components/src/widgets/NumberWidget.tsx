import { clsx } from "clsx";

import { SqNumberValue } from "@quri/squiggle-lang";

import { NumberShower } from "../components/NumberShower.js";
import { useViewerType } from "../components/SquiggleViewer/ViewerProvider.js";
import { formatNumber } from "../lib/d3/index.js";
import { widgetRegistry } from "./registry.js";

const showNumber = (value: SqNumberValue) => {
  const numberFormat = value.tags.numberFormat();
  if (numberFormat) {
    return formatNumber(numberFormat, value.value);
  } else {
    return <NumberShower precision={4} number={value.value} />;
  }
};

widgetRegistry.register("Number", {
  Preview: (value) => showNumber(value),
  Chart: (value) => {
    const viewerType = useViewerType();
    return (
      <div
        className={clsx(
          "font-semibold text-indigo-800",
          viewerType === "tooltip" && "text-lg"
        )}
      >
        {showNumber(value)}
      </div>
    );
  },
});
