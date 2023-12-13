import { getFunctionDocumentation } from "@quri/squiggle-lang";

import { ItemSettingsMenuItems } from "../../components/SquiggleViewer/ItemSettingsMenuItems.js";
import { FnDocumentation } from "../../components/ui/FnDocumentation.js";
import { widgetRegistry } from "../registry.js";
import { truncateStr } from "../utils.js";
import { AutomaticFunctionChart } from "./FunctionChart/AutomaticFunctionChart.js";

widgetRegistry.register("Lambda", {
  Preview: (value) => (
    <div>
      fn(
      <span className="opacity-60">
        {truncateStr(value.value.parameterString(), 15)}
      </span>
      )
    </div>
  ),
  Menu: (value) => {
    return <ItemSettingsMenuItems value={value} withFunctionSettings={true} />;
  },
  Chart: (value, settings) => {
    const environment = value.context.project.getEnvironment();
    //It's kind of awkward that the documentation isn't connected to the function itself, but that's a greater effort.
    if (value.value.type === "BuiltinLambda") {
      const name = value.value._value.getName();
      const documentation = getFunctionDocumentation(name);
      if (documentation) {
        return <FnDocumentation documentation={documentation} />;
      }
    }
    return (
      <AutomaticFunctionChart
        fn={value.value}
        settings={settings}
        height={settings.chartHeight}
        environment={{
          sampleCount: environment.sampleCount / 10,
          xyPointLength: environment.xyPointLength / 10,
        }}
      />
    );
  },
});
