import { widgetRegistry } from "./registry.js";

widgetRegistry.register("Specification", {
  Preview: (value) => value.value.title || "",
  Chart: (value) => <div className="text-lg">{value.value.title || ""}</div>,
});
