import { SquiggleValueChart } from "../components/SquiggleViewer/SquiggleValueChart.js";
import { valueToPreviewString } from "../components/SquiggleViewer/SquiggleValueHeader.js";
import { SquiggleValuePreview } from "../components/SquiggleViewer/SquiggleValuePreview.js";
import { valueHasContext } from "../lib/utility.js";
import { widgetRegistry } from "./registry.js";

widgetRegistry.register("Boxed", {
  heading: (value) => {
    const containedValue = value.value.value;
    if (valueHasContext(containedValue)) {
      return valueToPreviewString(containedValue);
    }
    return "Tagged";
  },
  Preview: (value) => {
    const _value = value.value.value;
    if (valueHasContext(_value)) {
      return <SquiggleValuePreview value={_value} />;
    }
  },
  Chart: (value, settings) => {
    const showAs = value.value.showAs();
    if (showAs && valueHasContext(showAs)) {
      return <SquiggleValueChart value={showAs} settings={settings} />;
    }

    const unboxedValue = value.value.value;
    if (valueHasContext(unboxedValue)) {
      return <SquiggleValueChart value={unboxedValue} settings={settings} />;
    } else {
      return unboxedValue.toString();
    }
  },
});
