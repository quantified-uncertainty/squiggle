import { formatDate } from "../lib/d3/index.js";
import { widgetRegistry } from "./registry.js";

const showDate = (value, boxed) => {
  const dateFormat = boxed && boxed.value.dateFormat();
  if (dateFormat) {
    return formatDate(value.value.toDate(), dateFormat);
  } else {
    return value.value.toString();
  }
};

widgetRegistry.register("Date", {
  Preview: (value, boxed) => showDate(value, boxed),
  Chart: (value, _, boxed) => showDate(value, boxed),
});
