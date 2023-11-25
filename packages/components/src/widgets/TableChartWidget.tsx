import { clsx } from "clsx";

import { SqError, SqValue, result } from "@quri/squiggle-lang";
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
        {!!value.title && (
          <div className="text-md text-slate-900 font-semibold mb-1">
            {value.title}
          </div>
        )}
        <div className="relative rounded-sm overflow-hidden border border-slate-200">
          <table
            className="table-fixed w-full"
            style={{ minWidth: columnLength * 100 }}
          >
            {hasColumnNames && (
              <thead className="text-xs text-gray-700 bg-gray-50 border-b border-slate-200">
                <tr>
                  {Array.from({ length: columnLength }, (_, i) => (
                    <th
                      key={i}
                      scope="col"
                      className={clsx(
                        "px-2 py-2",
                        i !== 0 && "border-slate-200 border-l"
                      )}
                    >
                      {columnNames[i] || ""}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rowsAndColumns.map((row, i) => (
                <tr key={i} className="border-b border-slate-100">
                  {row.map((item, k) => (
                    <td
                      key={k}
                      className={clsx(
                        "px-1 overflow-hidden",
                        k !== 0 && "border-slate-100 border-l"
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