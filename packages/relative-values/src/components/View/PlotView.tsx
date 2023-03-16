import { SqLambda } from "@quri/squiggle-lang";
import * as d3 from "d3";
import { FC, useEffect, useMemo, useRef } from "react";
import { useInterfaceContext } from "../Interface/InterfaceProvider";
import { ClusterFilter } from "./ClusterFilter";
import { CachedPairs, useCachedPairs, useFilteredItems } from "./hooks";
import { averageDb, averageMedian } from "./hooks/useSortedItems";
import { useViewContext } from "./ViewProvider";

const usePlotData = (cache: CachedPairs) => {
  const {
    catalog: { items },
  } = useInterfaceContext();

  const {
    axisConfig: { rows },
  } = useViewContext();

  const filteredItems = useFilteredItems({ items, config: rows });

  const data = useMemo(() => {
    const data: {
      median: number;
      db: number;
      clusterId: string | undefined;
    }[] = [];

    for (const item of filteredItems) {
      data.push({
        median: averageMedian({ item, comparedTo: items, cache }),
        db: averageDb({ item, comparedTo: items, cache }),
        clusterId: item.clusterId,
      });
    }
    return data;
  }, [filteredItems, cache]);
  return data;
};

export const PlotView: FC<{
  fn: SqLambda;
}> = ({ fn }) => {
  const {
    catalog: { items, clusters },
  } = useInterfaceContext();

  const ref = useRef<SVGGElement>(null);

  const width = 400;
  const height = 400;
  const margin = { top: 10, bottom: 40, left: 60, right: 20 };

  const allPairs = useCachedPairs(fn, items);

  const data = usePlotData(allPairs);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const g = d3.select(ref.current);
    g.selectAll("*").remove();

    const x = d3
      .scaleLog()
      .domain(d3.extent(data, (d) => d.median) as number[])
      .range([0, width]);
    const y = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.db) as number[])
      .range([height, 0]);

    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6, ".9~s"));
    const yAxis = g.append("g").call(d3.axisLeft(y).ticks(6, ".9~s"));

    const styleAxis = (axis: typeof xAxis) => {
      axis
        .selectAll(".domain")
        .attr("stroke", "#e2efe9")
        .attr("stroke-width", 2);
      axis.selectAll(".tick line").attr("stroke", "#ced6dc");
      axis.selectAll(".tick text").attr("fill", "#7a909a");
    };
    styleAxis(xAxis);
    styleAxis(yAxis);

    g.append("text")
      .attr("text-anchor", "end")
      .attr("x", width)
      .attr("y", height + 40)
      .attr("class", "font-bold text-xs fill-gray-500")
      .text("Mean relative value");

    g.append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("x", 0)
      .attr("y", -30)
      .attr("class", "font-bold text-xs fill-gray-500")
      .text("Uncertainty (decibels)");

    g.append("g")
      .selectAll("dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.median))
      .attr("cy", (d) => y(d.db))
      .attr("r", 4.5)
      .style("opacity", 0.7)
      .style("fill", (d) =>
        d.clusterId ? clusters[d.clusterId].color : "black"
      );
  }, [ref.current, data]);

  return (
    <div className="flex gap-8">
      <svg
        width={width + margin.left + margin.right}
        height={height + margin.top + margin.bottom}
      >
        <g transform={`translate(${margin.left},${margin.top})`} ref={ref} />
      </svg>
      <ClusterFilter axis="rows" />
    </div>
  );
};
