import { Env, result, SqError, SqLambda, SqValue } from "@quri/squiggle-lang";
import * as d3 from "d3";
import groupBy from "lodash/groupBy.js";
import * as React from "react";
import { FC, useCallback, useMemo, useRef } from "react";

import {
  drawAxes,
  drawVerticalCursorLine,
  getFunctionImage,
  Padding,
  primaryColor,
} from "../../lib/drawUtils.js";
import { useCanvas, useCanvasCursor } from "../../lib/hooks/index.js";
import { DrawContext } from "../../lib/hooks/useCanvas.js";
import { ErrorAlert } from "../Alert.js";
import {
  DistributionChart,
  DistributionChartSettings,
} from "../DistributionChart.js";
import { NumberShower } from "../NumberShower.js";
import { FunctionChartSettings } from "./index.js";

function unwrap<a, b>(x: result<a, b>): a {
  if (x.ok) {
    return x.value;
  } else {
    throw Error("FAILURE TO UNWRAP");
  }
}
type FunctionChart1DistProps = {
  fn: SqLambda;
  settings: FunctionChartSettings;
  distributionChartSettings: DistributionChartSettings;
  environment: Env;
  height: number;
};

const intervals = [
  { width: 0.2, opacity: 0.2 },
  { width: 0.4, opacity: 0.2 },
  { width: 0.6, opacity: 0.2 },
  { width: 0.8, opacity: 0.15 },
  { width: 0.9, opacity: 0.1 },
  { width: 0.98, opacity: 0.05 },
] as const;

type Width = (typeof intervals)[number]["width"];

type Datum = {
  x: number;
  areas: {
    [k in Width]: [number, number];
  };
  50: number;
};

type Errors = {
  [k: string]: {
    x: number;
    value: string;
  }[];
};

const getPercentiles = ({
  settings,
  fn,
  environment,
}: {
  settings: FunctionChartSettings;
  fn: SqLambda;
  environment: Env;
}) => {
  const { functionImage, errors } = getFunctionImage({
    settings,
    fn,
    valueType: "Dist",
  });

  const groupedErrors: Errors = groupBy(errors, (x) => x.value);

  const data: Datum[] = functionImage.map(({ x, y: dist }) => {
    const res = {
      x: x,
      areas: Object.fromEntries(
        intervals.map(({ width }) => {
          const left = (1 - width) / 2;
          const right = left + width;
          return [
            width as Width,
            [
              unwrap(dist.inv(environment, left)),
              unwrap(dist.inv(environment, right)),
            ],
          ];
        })
      ),
      50: unwrap(dist.inv(environment, 0.5)),
    } as Datum;

    return res;
  });

  return { data, errors: groupedErrors };
};

export const FunctionChart1Dist: FC<FunctionChart1DistProps> = ({
  fn,
  settings,
  environment,
  distributionChartSettings,
  height: innerHeight,
}) => {
  const height = innerHeight + 30; // consider paddings, should match suggestedPadding below
  const { cursor, initCursor } = useCanvasCursor();

  const { data, errors } = useMemo(
    () => getPercentiles({ settings, fn, environment }),
    [environment, fn, settings]
  );

  const draw = useCallback(
    ({ context, width }: DrawContext) => {
      context.clearRect(0, 0, width, height);

      const { xScale, yScale, padding, chartWidth, chartHeight } = drawAxes({
        suggestedPadding: { left: 20, right: 10, top: 10, bottom: 20 },
        xDomain: d3.extent(data, (d) => d.x) as [number, number],
        yDomain: [
          Math.min(
            ...data.map((d) =>
              Math.min(...Object.values(d.areas).map((p) => p[0]), d[50])
            )
          ),
          Math.max(
            ...data.map((d) =>
              Math.max(...Object.values(d.areas).map((p) => p[1]), d[50])
            )
          ),
        ],
        width,
        height,
        context,
      });
      d3ref.current = {
        padding,
        xScale,
      };

      // areas
      context.save();
      context.translate(padding.left, chartHeight + padding.top);
      context.scale(1, -1);

      context.fillStyle = primaryColor;
      for (const { width, opacity } of intervals) {
        context.globalAlpha = opacity;
        d3
          .area<Datum>()
          .x((d) => xScale(d.x))
          .y1((d) => yScale(d.areas[width][0]))
          .y0((d) => yScale(d.areas[width][1]))
          .context(context)(data);
        context.fill();
      }
      context.globalAlpha = 1;

      context.beginPath();
      context.strokeStyle = primaryColor;
      context.lineWidth = 2;
      context.imageSmoothingEnabled = true;

      d3
        .line<Datum>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d[50]))
        .context(context)(data);

      context.stroke();
      context.restore();

      if (
        cursor &&
        cursor[0] >= padding.left &&
        cursor[0] - padding.left <= chartWidth
      ) {
        drawVerticalCursorLine({
          cursor,
          padding,
          chartWidth,
          chartHeight,
          xScale,
          tickFormat: d3.format(",.4r"),
          context,
        });
      }
    },
    [cursor, height, data]
  );

  const { ref, width } = useCanvas({ height, init: initCursor, draw });

  const d3ref = useRef<{
    padding: Padding;
    xScale: d3.ScaleLinear<number, number, never>;
  }>();

  //TODO: This custom error handling is a bit hacky and should be improved.
  const mouseItem: result<SqValue, SqError> | undefined = useMemo(() => {
    if (!d3ref.current || !cursor || width === undefined) {
      return;
    }
    if (
      cursor[0] < d3ref.current.padding.left ||
      cursor[0] > width - d3ref.current.padding.right
    ) {
      return;
    }
    const x = d3ref.current.xScale.invert(
      cursor[0] - d3ref.current.padding.left
    );
    return x
      ? fn.call([x])
      : {
          ok: false,
          value: SqError.createOtherError(
            "Hover x-coordinate returned NaN. Expected a number."
          ),
        };
  }, [fn, cursor, width]);

  const showChart =
    mouseItem && mouseItem.ok && mouseItem.value.tag === "Dist" ? (
      <DistributionChart
        distribution={mouseItem.value.value}
        environment={environment}
        height={50}
        settings={distributionChartSettings}
      />
    ) : null;

  return (
    <div className="flex flex-col items-stretch">
      <canvas ref={ref}>Chart for {fn.toString()}</canvas>
      {showChart}
      {Object.entries(errors).map(([errorName, errorPoints]) => (
        <ErrorAlert key={errorName} heading={errorName}>
          Values:{" "}
          {errorPoints
            .map((r, i) => <NumberShower key={i} number={r.x} />)
            .reduce((a, b) => (
              <>
                {a}, {b}
              </>
            ))}
        </ErrorAlert>
      ))}
    </div>
  );
};
