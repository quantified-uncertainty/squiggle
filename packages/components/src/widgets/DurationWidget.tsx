import { clsx } from "clsx";

import { SqDurationValue } from "@quri/squiggle-lang";

import { NumberShower } from "../components/NumberShower.js";
import { formatNumber } from "../lib/d3/index.js";
import { widgetRegistry } from "./registry.js";
import { leftWidgetMargin } from "./utils.js";

const showDuration = (duration: SqDurationValue) => {
  const numberFormat = duration.tags.numberFormat();
  const { unitName, value } = duration.toUnitAndNumber();
  if (numberFormat) {
    return `${formatNumber(numberFormat, value)} ${unitName}s`;
  } else {
    return <NumberShower precision={4} number={value} unitName={unitName} />;
  }
};

widgetRegistry.register("Duration", {
  Preview: (value) => showDuration(value),
  Chart: (value) => {
    return (
      <div className={clsx("font-semibold text-indigo-800", leftWidgetMargin)}>
        {showDuration(value)}
      </div>
    );
  },
});
