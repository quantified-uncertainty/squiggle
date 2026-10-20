import { FC } from "react";

import type { RelativeValuesRow } from "@quri/squiggle-relative-values";

const format = new Intl.NumberFormat("en-US", { maximumSignificantDigits: 2 });

/**
 * Items ranked by their value in units of the dashboard's unit: a custom tab
 * (or custom single view). `rows` come from the dashboard, already filtered
 * and sorted, each with its value against `unit`.
 */
export const RankingTable: FC<{
  rows: readonly RelativeValuesRow[];
  unitName: string | undefined;
}> = ({ rows, unitName }) => {
  const shown = rows.flatMap((row) =>
    row.value ? [{ ...row, value: row.value }] : []
  );
  const maxMedian = Math.max(...shown.map((row) => row.value.median));

  return (
    <div className="ranking" data-host-content="">
      <p>
        Median value of each initiative in units of <strong>{unitName}</strong>,
        with a 90% interval.
      </p>
      <table className="ranking-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Initiative</th>
            <th style={{ width: "40%" }}>Median</th>
            <th className="ranking-number">Value</th>
            <th className="ranking-number">90% interval</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((row, i) => (
            <tr key={row.item.id} data-ranking-row={row.item.id}>
              <td>{i + 1}</td>
              <td>
                <span
                  className="ranking-dot"
                  style={{ background: row.cluster?.color ?? "#999" }}
                />
                <a className="acme-link" href={`#/initiative/${row.item.id}`}>
                  {row.item.name}
                </a>
              </td>
              <td>
                <div
                  className="ranking-bar"
                  style={{
                    width: `${Math.max(0, (row.value.median / maxMedian) * 100)}%`,
                  }}
                />
              </td>
              <td className="ranking-number" data-median={row.value.median}>
                {format.format(row.value.median)}
              </td>
              <td className="ranking-number">
                {format.format(row.value.min)} – {format.format(row.value.max)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
