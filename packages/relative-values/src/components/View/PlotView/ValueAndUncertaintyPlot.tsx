import { SqLambda } from "@quri/squiggle-lang";
import * as d3 from "d3";
import { FC, useEffect, useMemo, useRef } from "react";
import { useInterfaceContext } from "../../Interface/InterfaceProvider";
import { CachedPairs, useCachedPairs, useFilteredItems } from "../hooks";
import { averageDb, averageMedian } from "../hooks/useSortedItems";
import { useViewContext } from "../ViewProvider";

type Datum = {
  id: string;
  median: number;
  db: number;
  clusterId: string | undefined;
};

const usePlotData = (cache: CachedPairs) => {
  const {
    catalog: { items },
  } = useInterfaceContext();

  const {
    axisConfig: { rows },
  } = useViewContext();

  const filteredItems = useFilteredItems({ items, config: rows });

  const data = useMemo(() => {
    const data: Datum[] = [];

    for (const item of filteredItems) {
      data.push({
        id: item.id,
        median: averageMedian({ item, comparedTo: items, cache }),
        db: averageDb({ item, comparedTo: items, cache }),
        clusterId: item.clusterId,
      });
    }
    return data;
  }, [filteredItems, cache]);
  return data;
};

export const ValueAndUncertaintyPlot: FC<{
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

  type Obj = {
    xAxis: d3.Axis<d3.NumberValue>;
    yAxis: d3.Axis<d3.NumberValue>;
    xScale: d3.ScaleLogarithmic<number, number, never>;
    yScale: d3.ScaleLinear<number, number, never>;
  };

  const obj = useRef<Obj>();

  const updateScales = ({ xScale, yScale }: Pick<Obj, "xScale" | "yScale">) => {
    // TODO - take data as parameter?
    xScale
      .domain(d3.extent(data, (d) => d.median) as number[])
      .range([0, width]);

    yScale.domain(d3.extent(data, (d) => d.db) as number[]).range([height, 0]);
  };

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const xScale = d3.scaleLog();
    const yScale = d3.scaleLinear();

    updateScales({ xScale, yScale });

    const g = d3.select(ref.current);
    g.selectAll("*").remove();

    const xAxis = d3.axisBottom(xScale).ticks(6, ".9~s");

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .attr("id", "xAxis")
      .call(xAxis);

    const yAxis = d3.axisLeft(yScale).ticks(6, ".9~s");

    g.append("g").attr("id", "yAxis").call(yAxis);

    const styleAxis = (
      axis: d3.Selection<SVGGElement, unknown, null, undefined>
    ) => {
      axis
        .selectAll(".domain")
        .attr("class", "stroke-gray-300")
        .attr("stroke-width", 2);
      axis.selectAll(".tick line").attr("class", "stroke-gray-300");
      axis.selectAll(".tick text").attr("class", "fill-gray-500");
    };
    styleAxis(g.select("#xAxis"));
    styleAxis(g.select("#yAxis"));

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

    g.append("g").attr("id", "plot-data");

    obj.current = { xAxis, yAxis, xScale, yScale };
  }, [ref.current]); // intentionally doesn't depend on `x` and `y`, will transition axes later in the main loop

  useEffect(() => {
    if (!ref.current || !obj.current) {
      return;
    }

    const { xScale, yScale } = obj.current;

    const t = d3.transition<Datum>();

    const box = d3.select(ref.current);

    updateScales({ xScale, yScale });

    box
      .select("#xAxis")
      .transition(t)
      .call(obj.current.xAxis as any);
    box
      .select("#yAxis")
      .transition(t)
      .call(obj.current.yAxis as any);

    const g = box.select("#plot-data");

    g.selectAll("circle")
      .data(data, (d: any) => d.id)
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("r", 4.5)
            .style("opacity", 0.7)
            .style("fill", (d) =>
              d.clusterId ? clusters[d.clusterId].color : "black"
            )
            .attr("cx", (d) => xScale(d.median))
            .attr("cy", (d) => yScale(d.db)),
        (update) =>
          update.call((update) =>
            update
              .transition(t)
              .attr("cx", (d) => xScale(d.median))
              .attr("cy", (d) => yScale(d.db))
          )
      );
  }, [ref.current, obj.current, data]);

  return (
    <svg
      width={width + margin.left + margin.right}
      height={height + margin.top + margin.bottom}
    >
      <g transform={`translate(${margin.left},${margin.top})`} ref={ref} />
    </svg>
  );
};
