"use client";
import clsx from "clsx";
import _ from "lodash";
import { FC, Fragment, useMemo } from "react";

import { clustersIn } from "../../state/universe.js";
import type { Item } from "../../types.js";
import { getParamPercentiles } from "../../values/ModelEvaluator.js";
import type { RelativeValue } from "../../values/types.js";
import { useCore } from "../host/core.js";
import type { ConsumerRequirement } from "../host/requirements.js";
import { useRelativeValuesConsumer } from "../useRelativeValues.js";
import { CellBox } from "../views/CellBox.js";
import { Header } from "../views/Header.js";
import { ValueCell } from "../views/RelativeCell/ValueCell.js";
import { ViewStatus } from "../views/ViewStatus.js";

const allPairs: ConsumerRequirement = { kind: "requires", requires: "all" };

/**
 * The cluster-level matrix: the average relative value of the items of one
 * cluster in terms of another's. Clicking a cell shows those clusters in the
 * grid (rows from one, columns from the other).
 */
export const RelativeValuesClusterDiagram: FC<{ className?: string }> = ({
  className,
}) => {
  const core = useCore();
  const rv = useRelativeValuesConsumer(allPairs);
  const clickable = !core.isLocked("clusters") && !core.isLocked("columns");

  const matrix = useMemo(() => {
    if (rv.status !== "ready") {
      return undefined;
    }
    const clusters = clustersIn(rv.definition, rv.universe);
    const members = new Map(
      clusters.map((cluster) => [
        cluster.id,
        rv.universe.filter((item) => item.clusterId === cluster.id),
      ])
    );
    // Clusters as pseudo-items, to reuse the item header.
    const clusterItems: Item[] = clusters.map((cluster) => ({
      id: cluster.id,
      name: `${cluster.name || cluster.id} - ${members.get(cluster.id)?.length ?? 0}`,
      clusterId: cluster.id,
      description: "",
    }));
    const values = new Map<string, RelativeValue>();
    for (const row of clusters) {
      for (const column of clusters) {
        const combinations = (members.get(row.id) ?? []).flatMap((a) =>
          (members.get(column.id) ?? []).flatMap((b) => {
            const result = rv.compare(a.id, b.id);
            return result?.ok ? [result.value] : [];
          })
        );
        values.set(`${row.id}\0${column.id}`, {
          mean: _.mean(combinations.map((r) => r.mean)),
          median: _.mean(combinations.map((r) => r.median)),
          min: _.mean(combinations.map((r) => r.min)),
          max: _.mean(combinations.map((r) => r.max)),
          uncertainty: _.mean(combinations.map((r) => r.uncertainty)),
        });
      }
    }
    const percentiles = getParamPercentiles(
      [...values.values()],
      (r) => r.uncertainty,
      [10, 90],
      true
    );
    return { clusters, clusterItems, values, percentiles };
  }, [rv]);

  if (rv.status !== "ready" || !matrix) {
    return <ViewStatus controller={rv} />;
  }
  const { clusters, clusterItems, values, percentiles } = matrix;

  return (
    <div className={className} data-rv-part="cluster-diagram">
      <div
        className="relative grid"
        style={{
          gridTemplateColumns: `repeat(${clusterItems.length + 1}, 200px)`,
        }}
      >
        <div className="left-0 top-0 z-20" />
        {clusterItems.map((item, i) => (
          <CellBox header key={item.id}>
            <Header item={item} cluster={clusters[i]} />
          </CellBox>
        ))}
        {clusterItems.map((rowItem, i) => (
          <Fragment key={rowItem.id}>
            <CellBox header>
              <Header item={rowItem} cluster={clusters[i]} />
            </CellBox>
            {clusterItems.map((columnItem) => {
              const value = values.get(`${rowItem.id}\0${columnItem.id}`);
              return (
                <div
                  key={columnItem.id}
                  data-rv-row={rowItem.id}
                  data-rv-column={columnItem.id}
                  onClick={
                    clickable
                      ? () =>
                          core.dispatch(
                            {
                              type: "clusterCombination",
                              row: rowItem.id,
                              column: columnItem.id,
                            },
                            "user"
                          )
                      : undefined
                  }
                  className={clsx(clickable && "cursor-pointer")}
                >
                  <CellBox>
                    {value && (
                      <ValueCell
                        value={value}
                        display="valueAndUncertainty"
                        uncertaintyPercentiles={percentiles}
                        showMedian={rowItem.id !== columnItem.id}
                        place="clusterGrid"
                      />
                    )}
                  </CellBox>
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
};
