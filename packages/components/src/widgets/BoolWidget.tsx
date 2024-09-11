import { widgetRegistry } from "./registry.js";

widgetRegistry.register("Bool", {
  Preview: (value) => (
    <div className="font-mono text-slate-600">{value.value.toString()}</div>
  ),
  Chart: (value) => (
    <div className="text-md font-mono font-bold text-slate-800">
      {value.value.toString()}
    </div>
  ),
});
