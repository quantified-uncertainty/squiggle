import { widgetRegistry } from "./registry.js";

widgetRegistry.register("Bool", {
  Preview: (value) => value.value.toString(),
  Chart: (value) => (
    <div className="font-mono text-sm font-semibold text-indigo-800">
      {value.value.toString()}
    </div>
  ),
});
