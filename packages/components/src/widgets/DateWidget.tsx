import { widgetRegistry } from "./registry.js";

widgetRegistry.register("Date", {
  Chart: (value) => value.value.toDateString(),
});
