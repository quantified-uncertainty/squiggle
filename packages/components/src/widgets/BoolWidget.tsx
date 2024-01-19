import { widgetRegistry } from "./registry.js";

widgetRegistry.register("Bool", {
  Preview: (value) => value.value.toString(),
  Chart: (value) => (
    <div className="text-indigo-800 text-sm font-mono font-semibold">
      {value.value.toString()}
    </div>
  ),
});
