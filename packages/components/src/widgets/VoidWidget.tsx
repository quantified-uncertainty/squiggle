import { widgetRegistry } from "./registry.js";

widgetRegistry.register("Void", {
  Preview: () => "Empty value",
  Chart: () => <div className="text-sm italic text-slate-400">Empty value</div>,
});
