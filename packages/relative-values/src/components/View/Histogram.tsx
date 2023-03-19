import _ from "lodash";
import React, { useMemo, useRef } from "react";

import * as d3 from "d3";

import useSize from "@react-hook/size";
import { numberShow } from "./numberShower";

export type HistogramTheme = "dark" | "normal" | "light";

type Props = {
  bins?: number;
  data: number[]; // must be sorted
  domain: [number, number];
  hoveredXCoord?: number;
  allowHover?: boolean;
  cutOffRatio?: number;
  showTicks?: boolean;
  theme?: HistogramTheme;
};

export const Histogram: React.FC<Props> = ({
  bins = 30,
  cutOffRatio = 0, // By default cut off nothing
  data,
  domain,
  hoveredXCoord,
  allowHover,
  showTicks,
  theme = "normal",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, height] = useSize(containerRef);
  const { xScale, yScale, histogramData } = useMemo(() => {
    // It would be better to use scaleLog(), but it's not truly logarithmic by default and that causes issues.
    // Could probably be fixed with some parameters.
    const transformedDomain = [Math.log(domain[0]), Math.log(domain[1])] as [
      number,
      number
    ];
    const xScale = d3.scaleLinear().domain(transformedDomain).range([0, width]);

    const histogramDataFn = d3
      .bin()
      .value((d) => {
        const value = Math.log(d);
        return Math.max(
          transformedDomain[0],
          Math.min(transformedDomain[1], value)
        );
      })
      .domain(transformedDomain)
      .thresholds(bins);
    const histogramData = histogramDataFn(data);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(histogramData, (d) => d.length) as number])
      .range([height, 0]);

    return { xScale, yScale, histogramData };
  }, [bins, data, cutOffRatio, width, height]);

  const barWidth = width / histogramData.length;
  if (!_.isFinite(barWidth)) {
    return null;
  }

  return (
    <div ref={containerRef} className="h-full">
      <svg className="h-full w-full">
        <g>
          {histogramData.map((d, i) => (
            <Bar
              key={i}
              data={d}
              xScale={xScale}
              yScale={yScale}
              barWidth={barWidth}
              height={height}
              theme={theme}
            />
          ))}
        </g>
        {allowHover && <Hoverbar hoveredXCoord={hoveredXCoord} />}
        {showTicks && (
          <g>
            <XAxis scale={xScale} height={height} />
          </g>
        )}
      </svg>
    </div>
  );
};

const Hoverbar: React.FC<{
  hoveredXCoord: number | undefined;
}> = ({ hoveredXCoord }) => {
  return (
    <line
      x1={hoveredXCoord}
      x2={hoveredXCoord}
      y1={0}
      y2="100%"
      className="stroke-[#0e2c40]/50"
      style={{ strokeDasharray: "8, 5" }}
    />
  );
};

const Path: React.FC<{ scale: d3.ScaleLinear<number, number> }> = ({
  scale,
}) => {
  const [start, end] = scale.range();
  const d = `M0${start},6V0H${end}V6`;

  return (
    <path
      className="fill-none"
      style={{ shapeRendering: "crispEdges" }}
      d={d}
    />
  );
};

const Tick: React.FC<{
  value: number;
  scale: d3.ScaleLinear<number, number>;
}> = ({ value, scale }) => {
  const valueText = numberShow(value);
  let text = valueText.value;
  text += valueText.symbol ? valueText.symbol : "";
  text += valueText.power ? `e${valueText.power}` : "";
  if (text === "0.0") {
    text = "0";
  }
  return (
    <g transform={`translate(${scale(value)},0)`}>
      <text
        dy=".71em"
        y="-15"
        x="-6"
        className="fill-grey-666 text-[13px] font-semibold"
      >
        {text}
      </text>
    </g>
  );
};

const XAxis: React.FC<{
  scale: d3.ScaleLinear<number, number>;
  height: number;
}> = ({ scale, height }) => {
  const ticks = scale.ticks
    .apply(scale)
    .map((tick, i) => <Tick value={tick} scale={scale} key={i} />);

  return (
    <g transform={`translate(0,${height})`}>
      <Path scale={scale} />
      <g>{ticks}</g>
    </g>
  );
};

const Bar: React.FC<{
  data: d3.Bin<number, number>;
  xScale: d3.ScaleLinear<number, number>;
  yScale: d3.ScaleLinear<number, number>;
  barWidth: number;
  height: number;
  theme: HistogramTheme;
}> = ({ data, xScale, yScale, barWidth, height, theme }) => {
  const scaledX = xScale(data.x0!);
  const scaledY = yScale(data.length);

  const themeToColor: { [t in HistogramTheme]: string } = {
    dark: "fill-[#92a9b8]",
    normal: "fill-[#dee8ee]",
    light: "fill-grey-a1",
  };

  return (
    <g
      className={themeToColor[theme]}
      transform={`translate(${scaledX},${scaledY})`}
    >
      <rect width={barWidth} height={height - scaledY} />
    </g>
  );
};
