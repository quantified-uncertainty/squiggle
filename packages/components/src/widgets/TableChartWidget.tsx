import { clsx } from "clsx";

import { result, SqError, SqValue } from "@quri/squiggle-lang";
import { TableCellsIcon } from "@quri/ui";

import { PlaygroundSettings } from "../components/PlaygroundSettings.js";
import { SquiggleValueChart } from "../components/SquiggleViewer/SquiggleValueChart.js";
import { valueHasContext } from "../lib/utility.js";
import { widgetRegistry } from "./registry.js";

widgetRegistry.register("TableChart", {
  Preview: (value) => (
    <div className="items-center flex space-x-1">
      <TableCellsIcon size={14} className="flex opacity-60" />
      <div>
        {value.value.rowCount}
        <span className="opacity-60">x</span>
        {value.value.columnCount}
      </div>
    </div>
  ),
  Chart: (valueWithContext, settings) => {
    const environment = valueWithContext.context.project.getEnvironment();
    const value = valueWithContext.value;

    const rowsAndColumns = value.items(environment);
    const columnNames = value.columnNames;
    const hasColumnNames = columnNames.filter((name) => !!name).length > 0;
    const columnLength = Math.max(
      columnNames ? columnNames.length : 0,
      rowsAndColumns[0]?.length ?? 0
    );

    const chartHeight = 50;
    const distributionChartSettings = {
      ...settings.distributionChartSettings,
      showSummary: false,
    };
    const adjustedSettings: PlaygroundSettings = {
      ...settings,
      distributionChartSettings,
      chartHeight,
    };

    const showItem = (
      item: result<SqValue, SqError>,
      settings: PlaygroundSettings
    ) => {
      if (item.ok) {
        const value = item.value;
        if (valueHasContext(value)) {
          return <SquiggleValueChart value={value} settings={settings} />;
        } else {
          return value.toString();
        }
      } else {
        return item.value.toString();
      }
    };

    return (
      <div>
        <div className="relative rounded-md overflow-hidden border border-stone-200">
          <table
            className="table-fixed w-full"
            style={{ minWidth: columnLength * 100 }}
          >
            {hasColumnNames && (
              <thead className="text-sm text-stone-500 bg-stone-50 border-b border-stone-200">
                <tr>
                  {Array.from({ length: columnLength }, (_, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="px-2 py-2 text-left font-medium"
                    >
                      {columnNames[i] || ""}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rowsAndColumns.map((row, i) => (
                <tr key={i} className="border-b border-stone-100">
                  {row.map((item, k) => (
                    <td
                      key={k}
                      className={clsx(
                        "px-1 overflow-hidden",
                        k !== 0 && "border-stone-100 border-l"
                      )}
                    >
                      {showItem(item, adjustedSettings)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
});
