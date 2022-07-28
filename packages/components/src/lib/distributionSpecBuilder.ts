import { VisualizationSpec } from "react-vega";
import type { LogScale, LinearScale, PowScale } from "vega";

export type DistributionChartSpecOptions = {
  /** Set the x scale to be logarithmic by default */
  logX: boolean;
  /** Set the y scale to be exponential by default */
  expY: boolean;
  /** The minimum x coordinate shown on the chart */
  minX?: number;
  /** The maximum x coordinate shown on the chart */
  maxX?: number;
  /** The color of the chart */
  color: string;
  /** The title of the chart */
  title: string;
  /** How to format numbers on the x axis */
  tickFormat: string;
};

export let linearXScale: LinearScale = {
  name: "xscale",
  clamp: true,
  type: "linear",
  range: "width",
  zero: false,
  nice: false,
  domain: {
    fields: [
      {
        data: "con",
        field: "x",
      },
      {
        data: "dis",
        field: "x",
      },
    ],
  },
};
export let linearYScale: LinearScale = {
  name: "yscale",
  type: "linear",
  range: "height",
  zero: true,
  domain: {
    fields: [
      {
        data: "con",
        field: "y",
      },
      {
        data: "dis",
        field: "y",
      },
    ],
  },
};

export let logXScale: LogScale = {
  name: "xscale",
  type: "log",
  range: "width",
  zero: false,
  base: 10,
  nice: false,
  clamp: true,
  domain: {
    fields: [
      {
        data: "con",
        field: "x",
      },
      {
        data: "dis",
        field: "x",
      },
    ],
  },
};

export let expYScale: PowScale = {
  name: "yscale",
  type: "pow",
  exponent: 0.1,
  range: "height",
  zero: true,
  nice: false,
  domain: {
    fields: [
      {
        data: "con",
        field: "y",
      },
      {
        data: "dis",
        field: "y",
      },
    ],
  },
};

export function buildVegaSpec(
  specOptions: DistributionChartSpecOptions
): VisualizationSpec {
  let { tickFormat, color, title, minX, maxX, logX, expY } = specOptions;

  let xScale = logX ? logXScale : linearXScale;
  if (minX !== undefined && Number.isFinite(minX)) {
    xScale = { ...xScale, domainMin: minX };
  }

  if (maxX !== undefined && Number.isFinite(maxX)) {
    xScale = { ...xScale, domainMax: maxX };
  }

  let spec: VisualizationSpec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description: "A basic area chart example",
    width: 500,
    height: 100,
    padding: 5,
    data: [
      {
        name: "con",
      },
      {
        name: "dis",
      },
    ],
    signals: [],
    scales: [xScale, expY ? expYScale : linearYScale],
    axes: [
      {
        orient: "bottom",
        scale: "xscale",
        labelColor: "#727d93",
        tickColor: "#fff",
        tickOpacity: 0.0,
        domainColor: "#fff",
        domainOpacity: 0.0,
        format: tickFormat,
        tickCount: 10,
      },
    ],
    marks: [
      {
        type: "area",
        from: {
          data: "con",
        },
        encode: {
          update: {
            interpolate: { value: "linear" },
            x: {
              scale: "xscale",
              field: "x",
            },
            y: {
              scale: "yscale",
              field: "y",
            },
            y2: {
              scale: "yscale",
              value: 0,
            },
            fill: {
              value: color,
            },
            fillOpacity: {
              value: 1,
            },
          },
        },
      },
      {
        type: "rect",
        from: {
          data: "dis",
        },
        encode: {
          enter: {
            width: {
              value: 1,
            },
          },
          update: {
            x: {
              scale: "xscale",
              field: "x",
            },
            y: {
              scale: "yscale",
              field: "y",
            },
            y2: {
              scale: "yscale",
              value: 0,
            },
            fill: {
              value: "#2f65a7",
            },
          },
        },
      },
      {
        type: "symbol",
        from: {
          data: "dis",
        },
        encode: {
          enter: {
            shape: {
              value: "circle",
            },
            size: [{ value: 100 }],
            tooltip: {
              signal: "{ probability: datum.y, value: datum.x }",
            },
          },
          update: {
            x: {
              scale: "xscale",
              field: "x",
            },
            y: {
              scale: "yscale",
              field: "y",
            },
            fill: {
              value: "#1e4577",
            },
          },
        },
      },
    ],
  };
  if (title) {
    spec = {
      ...spec,
      title: {
        text: title,
      },
    };
  }

  return spec;
}
