import { SqDateValue } from "@quri/squiggle-lang";

import { formatDate } from "../lib/d3/index.js";
import { widgetRegistry } from "./registry.js";

const showDate = (value: SqDateValue) => {
  const dateFormat = value.tags.dateFormat();
  if (dateFormat) {
    return formatDate(value.value.toDate(), dateFormat);
  } else {
    return value.value.toString();
  }
};

widgetRegistry.register("Date", {
  Preview: (value) => showDate(value),
  Chart: (value) => showDate(value),
});
