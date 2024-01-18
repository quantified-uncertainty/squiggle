import { SqNumberValue } from "@quri/squiggle-lang";

import { NumberShower } from "../components/NumberShower.js";
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
  Chart: (value) => (
    <div className="font-semibold text-indigo-800">{showNumber(value)}</div>
  ),
});
