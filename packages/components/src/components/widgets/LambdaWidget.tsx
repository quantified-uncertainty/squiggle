import { FunctionChart } from "../FunctionChart/index.js";
import { ItemSettingsMenu } from "../SquiggleViewer/ItemSettingsMenu.js";
import { widgetRegistry } from "./registry.js";
import { truncateStr } from "./utils.js";

widgetRegistry.register("Lambda", {
  renderPreview: (value) => (
    <div>
      fn(
      <span className="opacity-60">
        {truncateStr(value.value.parameterString(), 15)}
      </span>
      )
    </div>
  ),
  renderSettingsMenu: (value, { onChange }) => {
    return (
      <ItemSettingsMenu
        value={value}
        onChange={onChange}
        withFunctionSettings={true}
      />
    );
  },
  render: (value, settings) => {
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
