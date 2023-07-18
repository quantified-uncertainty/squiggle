import * as d3 from "d3";
import groupBy from "lodash/groupBy.js";
import { FC, useCallback, useMemo, useRef } from "react";

import {
  Env,
  SqDistFnPlot,
  SqDistributionsPlot,
  SqError,
  SqLinearScale,
  SqNumberValue,
  SqOtherError,
  SqValue,
  result,
} from "@quri/squiggle-lang";

import { sqScaleToD3 } from "../../lib/d3/index.js";
import { scaleLinear } from "../../lib/d3/patchedScales.js";
import {
  AnyChartScale,
  drawAxes,
  drawCursorLines,
  primaryColor,
} from "../../lib/draw/index.js";
import { Padding } from "../../lib/draw/types.js";
import { useCanvas, useCanvasCursor } from "../../lib/hooks/index.js";
import { DrawContext } from "../../lib/hooks/useCanvas.js";
import { canvasClasses } from "../../lib/utility.js";
import { ErrorAlert } from "../Alert.js";
import { DistributionsChart } from "../DistributionsChart/index.js";
import { NumberShower } from "../NumberShower.js";
import { getFunctionImage } from "./utils.js";

function unwrap<a, b>(x: result<a, b>): a {
  if (x.ok) {
    return x.value;
  } else {
    throw Error("FAILURE TO UNWRAP");
  }
}
type FunctionChart1DistProps = {
  plot: SqDistFnPlot;
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
  plot,
  environment,
}: {
  plot: SqDistFnPlot;
  environment: Env;
}) => {
  const { functionImage, errors } = getFunctionImage(plot, environment);

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

export const DistFunctionChart: FC<FunctionChart1DistProps> = ({
  plot,
  environment,
  height: innerHeight,
}) => {
  const height = innerHeight + 30; // consider paddings, should match suggestedPadding below
  const { cursor, initCursor } = useCanvasCursor();

  const { data, errors } = useMemo(
    () => getPercentiles({ plot, environment }),
    [plot, environment]
  );

  const { xScale, yScale } = useMemo(() => {
    const xScale = sqScaleToD3(plot.xScale);
    xScale.domain(
      d3.extent(
        data.filter((d) => isFinite(d.x)),
        (d) => d.x
      ) as [number, number]
    );

    const yScale = scaleLinear().domain([
      Math.min(
        ...data.map((d) =>
          Math.min(
            ...Object.values(d.areas)
              .map((p) => p[0])
              .filter(isFinite),
            d[50]
          )
        )
      ),
      Math.max(
        ...data.map((d) =>
          Math.max(
            ...Object.values(d.areas)
              .map((p) => p[1])
              .filter(isFinite),
            d[50]
          )
        )
      ),
    ]);

    return { xScale, yScale };
  }, [data, plot.xScale]);

  const draw = useCallback(
    ({ context, width }: DrawContext) => {
      context.clearRect(0, 0, width, height);

      const { padding, frame } = drawAxes({
        suggestedPadding: { left: 20, right: 10, top: 10, bottom: 20 },
        xScale,
        yScale,
        width,
        height,
        context,
        xTickFormat: plot.xScale.tickFormat,
      });
      d3ref.current = {
        padding,
        xScale,
      };

      // areas
      frame.enter();

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
      frame.exit();

      if (
        cursor &&
        cursor.x >= padding.left &&
        cursor.x - padding.left <= frame.width
      ) {
        drawCursorLines({
          frame,
          cursor,
          x: {
            scale: xScale,
            format: plot.xScale.tickFormat,
          },
        });
      }
    },
    [cursor, height, data, plot, xScale, yScale]
  );

  const { ref, width } = useCanvas({ height, init: initCursor, draw });

  const d3ref = useRef<{
    padding: Padding;
    xScale: AnyChartScale;
  }>();

  const mouseX: number | undefined = useMemo(() => {
    if (!d3ref.current || !cursor || width === undefined) {
      return;
    }
    if (
      cursor.x < d3ref.current.padding.left ||
      cursor.x > width - d3ref.current.padding.right
    ) {
      return;
    }
    return d3ref.current.xScale.invert(cursor.x - d3ref.current.padding.left);
  }, [cursor, width]);

  //TODO: This custom error handling is a bit hacky and should be improved.
  const mouseItem: result<SqValue, SqError> | undefined = useMemo(() => {
    return mouseX
      ? plot.fn.call([SqNumberValue.create(mouseX)], environment)
      : {
          ok: false,
          value: new SqOtherError(
            "Hover x-coordinate returned NaN. Expected a number."
          ),
        };
  }, [plot.fn, environment, mouseX]);

  const showChart =
    mouseItem &&
    mouseItem.ok &&
    mouseItem.value.tag === "Dist" &&
    d3ref.current &&
    mouseX !== undefined ? (
      <DistributionsChart
        plot={SqDistributionsPlot.create({
          distribution: mouseItem.value.value,
          xScale: plot.distXScale,
          yScale: SqLinearScale.create(),
          showSummary: false,
          // TODO - use an original function name? it could be obtained with `pathToShortName`, but there's a corner case for arrays.
          title: `f(${d3ref.current.xScale.tickFormat(
            undefined,
            plot.xScale.tickFormat
          )(mouseX)})`,
        })}
        environment={environment}
        height={50}
      />
    ) : null; // TODO - show error

  return (
    <div className="flex flex-col items-stretch">
      <canvas ref={ref} className={canvasClasses}>
        Chart for {plot.toString()}
      </canvas>
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
