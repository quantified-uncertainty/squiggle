import { ItemSettingsMenuItems } from "../../components/SquiggleViewer/ItemSettingsMenuItems.js";
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
