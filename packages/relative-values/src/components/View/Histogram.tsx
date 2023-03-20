import _ from "lodash";
import React, { useMemo, useRef } from "react";

import * as d3 from "d3";

import { RelativeValue } from "@/values/RelativeValue";
import useSize from "@react-hook/size";

export type HistogramTheme = "dark" | "normal" | "light";

type Props = {
  relativeValue: RelativeValue;
  bins?: number;
  domain: [number, number];
  theme?: HistogramTheme;
};

export const Histogram: React.FC<Props> = ({
  bins = 30,
  relativeValue,
  domain,
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
    const histogramData = relativeValue.histogramData(transformedDomain, bins);
    const xScale = d3.scaleLinear().domain(transformedDomain).range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(histogramData, (d) => d.length) as number])
      .range([height, 0]);

    return { xScale, yScale, histogramData };
  }, [bins, relativeValue, domain, width, height]);

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
      </svg>
    </div>
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
