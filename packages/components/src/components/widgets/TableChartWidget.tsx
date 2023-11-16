import { TableCellsIcon } from "@quri/ui";

import { widgetRegistry } from "./registry.js";
import { TableChart } from "../TableChart/index.js";

widgetRegistry.register("TableChart", {
  renderPreview: (value) => (
    <div className="items-center flex space-x-1">
      <TableCellsIcon size={14} className="flex opacity-60" />
      <div>
        {value.value.rowCount}
        <span className="opacity-60">x</span>
        {value.value.columnCount}
      </div>
    </div>
  ),
  render: (value, settings) => (
    <TableChart
      value={value.value}
      environment={value.context.project.getEnvironment()}
      settings={settings}
    />
  ),
});
