import { widgetRegistry } from "./registry.js";

widgetRegistry.register("Void", {
  Preview: () => "Empty value",
  Chart: () => <div className="italic text-slate-400 text-sm">Empty value</div>,
});
