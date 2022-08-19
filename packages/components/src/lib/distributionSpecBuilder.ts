import { VisualizationSpec } from "react-vega";
import type { LogScale, LinearScale, PowScale } from "vega";

export type DistributionChartSpecOptions = {
  /** Set the x scale to be logarithmic by deault */
  logX: boolean;
  /** Set the y scale to be exponential by deault */
  expY: boolean;
  /** The minimum x coordinate shown on the chart */
  minX?: number;
  /** The maximum x coordinate shown on the chart */
  maxX?: number;
  /** The color of the chart */
  color?: string;
  /** The title of the chart */
  title?: string;
  /** The formatting of the ticks */
  format?: string;
};

export let linearXScale: LinearScale = {
  name: "xscale",
  clamp: true,
  type: "linear",
  range: "width",
  zero: false,
  nice: false,
  domain: { data: "domain", field: "x" },
};
export let linearYScale: LinearScale = {
  name: "yscale",
  type: "linear",
  range: "height",
  zero: true,
  domain: { data: "domain", field: "y" },
};

export let logXScale: LogScale = {
  name: "xscale",
  type: "log",
  range: "width",
  zero: false,
  base: 10,
  nice: false,
  clamp: true,
  domain: { data: "domain", field: "x" },
};

export let expYScale: PowScale = {
  name: "yscale",
  type: "pow",
  exponent: 0.1,
  range: "height",
  zero: true,
  nice: false,
  domain: { data: "domain", field: "y" },
};

export const defaultTickFormat = ".9~s";
export const defaultColor = "#739ECC";

export function buildVegaSpec(
  specOptions: DistributionChartSpecOptions
): VisualizationSpec {
  const {
    format = defaultTickFormat,
    color = defaultColor,
    title,
    minX,
    maxX,
    logX,
    expY,
  } = specOptions;

  let xScale = logX ? logXScale : linearXScale;
  if (minX !== undefined && Number.isFinite(minX)) {
    xScale = { ...xScale, domainMin: minX };
  }

  if (maxX !== undefined && Number.isFinite(maxX)) {
    xScale = { ...xScale, domainMax: maxX };
  }

  let spec: VisualizationSpec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description: "Squiggle plot chart",
    width: 500,
    height: 100,
    padding: 5,
    data: [
      {
        name: "data",
      },
      {
        name: "domain",
      },
    ],
    signals: [],
    scales: [
      xScale,
      expY ? expYScale : linearYScale,
      {
        name: "color",
        type: "ordinal",
        domain: {
          data: "data",
          field: "name",
        },
        range: { scheme: "category10" },
      },
    ],
    axes: [
      {
        orient: "bottom",
        scale: "xscale",
        labelColor: "#727d93",
        tickColor: "#fff",
        tickOpacity: 0.0,
        domainColor: "#fff",
        domainOpacity: 0.0,
        format: format,
        tickCount: 10,
      },
    ],
    marks: [
      {
        name: "all_distributions",
        type: "group",
        from: {
          facet: {
            name: "distribution_facet",
            data: "data",
            groupby: ["name"],
          },
        },
        marks: [
          {
            name: "continuous_distribution",
            type: "group",
            from: {
              facet: {
                name: "continuous_facet",
                data: "distribution_facet",
                field: "continuous",
              },
            },
            encode: {
              update: {},
            },
            marks: [
              {
                name: "continuous_area",
                type: "area",
                from: {
                  data: "continuous_facet",
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
                    fill: {
                      scale: "color",
                      field: { parent: "name" },
                    },
                    y2: {
                      scale: "yscale",
                      value: 0,
                    },
                    fillOpacity: {
                      value: 1,
                    },
                  },
                },
              },
            ],
          },
          {
            name: "discrete_distribution",
            type: "group",
            from: {
              facet: {
                name: "discrete_facet",
                data: "distribution_facet",
                field: "discrete",
              },
            },
            marks: [
              {
                type: "rect",
                from: {
                  data: "discrete_facet",
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
                      scale: "color",
                      field: { parent: "name" },
                    },
                  },
                },
              },
              {
                type: "symbol",
                from: {
                  data: "discrete_facet",
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
                      scale: "color",
                      field: { parent: "name" },
                    },
                  },
                },
              },
            ],
          },
        ],
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
