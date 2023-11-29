import { widgetRegistry } from "./registry.js";

widgetRegistry.register("Duration", {
  Chart: (value) => value.toString(),
});
