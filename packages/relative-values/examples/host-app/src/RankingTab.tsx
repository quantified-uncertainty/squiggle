import { FC } from "react";

import type { RelativeValuesTabContext } from "@quri/squiggle-relative-values";

const format = new Intl.NumberFormat("en-US", { maximumSignificantDigits: 2 });

/**
 * A custom dashboard tab: items ranked by their value in terms of the
 * recommended unit. It gets the filtered and sorted items, the evaluator (all
 * pairs are computed by the time it renders) and the clusters.
 */
export const RankingTab: FC<{ context: RelativeValuesTabContext }> = ({
  context: { definition, evaluator, items, clusters },
}) => {
  const unit =
    definition.items.find((item) => item.id === definition.recommendedUnit) ??
    definition.items[0];

  const rows = items
    .map((item) => ({ item, result: evaluator.compare(item.id, unit.id) }))
    .flatMap(({ item, result }) =>
      result.ok ? [{ item, ...result.value }] : []
    )
    .sort((a, b) => b.median - a.median);
  const maxMedian = Math.max(...rows.map((row) => row.median));

  return (
    <div className="ranking">
      <p>
        Median value of each initiative in units of <strong>{unit.name}</strong>
        , with a 90% interval.
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
          {rows.map((row, i) => {
            const cluster = row.item.clusterId
              ? clusters[row.item.clusterId]
              : undefined;
            return (
              <tr key={row.item.id}>
                <td>{i + 1}</td>
                <td>
                  <span
                    className="ranking-dot"
                    style={{ background: cluster?.color ?? "#999" }}
                  />
                  <a className="acme-link" href={`#/initiative/${row.item.id}`}>
                    {row.item.name}
                  </a>
                </td>
                <td>
                  <div
                    className="ranking-bar"
                    style={{
                      width: `${Math.max(0, (row.median / maxMedian) * 100)}%`,
                    }}
                  />
                </td>
                <td className="ranking-number">{format.format(row.median)}</td>
                <td className="ranking-number">
                  {format.format(row.min)} – {format.format(row.max)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
