import { ItemSettingsMenu } from "../../components/SquiggleViewer/ItemSettingsMenu.js";
import { widgetRegistry } from "../registry.js";
import { truncateStr } from "../utils.js";
import { FunctionChart } from "./FunctionChart/index.js";

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
    return <ItemSettingsMenu value={value} withFunctionSettings={true} />;
  },
  Chart: (value, settings) => {
    const environment = value.context.project.getEnvironment();
    return (
      <FunctionChart
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
