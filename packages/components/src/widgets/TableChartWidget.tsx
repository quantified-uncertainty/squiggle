import clsx from "clsx";
import { useRef } from "react";

import { SqValue, SqValuePath } from "@quri/squiggle-lang";
import { TableCellsIcon } from "@quri/ui";

import { PlaygroundSettings } from "../components/PlaygroundSettings.js";
import { useTableCellKeyEvent } from "../components/SquiggleViewer/keyboardNav/tableCell.js";
import { SquiggleValueChart } from "../components/SquiggleViewer/SquiggleValueChart.js";
import {
  useRegisterAsItemViewer,
  useZoomIn,
} from "../components/SquiggleViewer/ViewerProvider.js";
import { valueHasContext } from "../lib/utility.js";
import { widgetRegistry } from "./registry.js";

interface ValidTableCellProps {
  value: SqValue;
  settings: PlaygroundSettings;
  path: SqValuePath;
}

export type TableCellHandle = {
  focus: () => void;
};

const ValidTableCell: React.FC<ValidTableCellProps> = ({
  value,
  path,
  settings,
}) => {
  const cellNav = useTableCellKeyEvent(path);

  const ref = useRef<HTMLTableDataCellElement>(null);

  const handle: TableCellHandle = {
    focus: () => {
      ref.current?.focus();
    },
  };

  useRegisterAsItemViewer(path, { type: "cellItem", value: handle });

  return (
    <td
      ref={ref}
      tabIndex={1}
      onKeyDown={cellNav}
      className={clsx(
        "px-1 overflow-hidden",
        "border-stone-100 border-l",
        "focus:bg-blue-50"
      )}
    >
      {valueHasContext(value) ? (
        <SquiggleValueChart value={value} settings={settings} />
      ) : (
        value.toString()
      )}
    </td>
  );
};

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
    const rowsAndColumns = value.itemsAndCache(environment);
    const zoomedIn = useZoomIn();
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

    return (
      <div>
        <div className="relative rounded-md overflow-hidden border border-stone-200 mt-0.5">
          <table
            className="table-fixed w-full"
            style={{ minWidth: columnLength * 100 }}
          >
            {hasColumnNames && (
              <thead className="text-sm text-stone-500 bg-stone-50 border-b border-stone-200 break-words">
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
                  {row.map((item, k) => {
                    if (item.ok && item.value.context) {
                      return (
                        <ValidTableCell
                          key={k}
                          value={item.value}
                          path={item.value.context.path}
                          settings={adjustedSettings}
                        />
                      );
                    } else {
                      return null;
                    }
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
});
