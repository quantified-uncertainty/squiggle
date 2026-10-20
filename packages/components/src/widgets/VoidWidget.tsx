import { widgetRegistry } from "./registry.js";

widgetRegistry.register("Void", {
  Preview: () => "Empty value",
  Chart: () => <div className="text-sm italic text-slate-500">Empty value</div>,
});
