import { clsx } from "clsx";

import { SqNumberValue } from "@quri/squiggle-lang";

import { NumberShower } from "../components/NumberShower.js";
import { formatNumber } from "../lib/d3/index.js";
import { widgetRegistry } from "./registry.js";
import { leftWidgetMargin } from "./utils.js";

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
  Chart: (value) => (
    <div className={clsx("font-semibold text-indigo-800", leftWidgetMargin)}>
      {showNumber(value)}
    </div>
  ),
});
