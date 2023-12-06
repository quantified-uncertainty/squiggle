import { SquiggleValueChart } from "../components/SquiggleViewer/SquiggleValueChart.js";
import { valueHasContext } from "../lib/utility.js";
import { widgetRegistry } from "./registry.js";

widgetRegistry.register("Boxed", {
  Chart: (value, settings) => {
    const showAs = value.showAs();
    if (showAs && valueHasContext(showAs)) {
      return <SquiggleValueChart value={showAs} settings={settings} />;
    }

    const unboxedValue = value.value;
    if (valueHasContext(unboxedValue)) {
      return (
        <div>
          <div className="text-sm text-slate-600 ml-1.5">{value.title()}</div>
          <SquiggleValueChart value={unboxedValue} settings={settings} />
        </div>
      );
    } else {
      return unboxedValue.toString();
    }
  },
});
