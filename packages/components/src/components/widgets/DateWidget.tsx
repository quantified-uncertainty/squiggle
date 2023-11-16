import { widgetRegistry } from "./registry.js";

widgetRegistry.register("Date", {
  render: (value) => value.value.toDateString(),
});
