import { widgetRegistry } from "./registry.js";

widgetRegistry.register("TimeDuration", {
  Chart: (value) => value.toString(),
});
