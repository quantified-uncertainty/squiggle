import { VisualizationSpec } from "react-vega";
import type { LogScale, LinearScale, PowScale, TimeScale } from "vega";

export type DistributionChartSpecOptions = {
  /** Set the x scale to be logarithmic by deault */
  logX: boolean;
  /** Set the y scale to be exponential by deault */
  expY: boolean;
  /** The minimum x coordinate shown on the chart */
  minX?: number;
  /** The maximum x coordinate shown on the chart */
  maxX?: number;
  /** The title of the chart */
  title?: string;
  /** The formatting of the ticks */
  format?: string;
};

export const timeXScale: TimeScale = {
  name: "xscale",
  clamp: true,
  type: "time",
  range: "width",
  nice: false,
  domain: { data: "domain", field: "dateTime" },
};
export const timeYScale: TimeScale = {
  name: "yscale",
  type: "time",
  range: "height",
  domain: { data: "domain", field: "y" },
};

export const defaultTickFormat = "%b %d, %Y %H:%M";

export function buildDateVegaSpec(
  specOptions: DistributionChartSpecOptions
): VisualizationSpec {
  const {
    format = defaultTickFormat,
    title,
    minX,
    maxX,
    logX,
    expY,
  } = specOptions;

  let xScale = timeXScale;
  if (minX !== undefined && Number.isFinite(minX)) {
    xScale = { ...xScale, domainMin: minX };
  }

  if (maxX !== undefined && Number.isFinite(maxX)) {
    xScale = { ...xScale, domainMax: maxX };
  }

  const spec: VisualizationSpec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    description: "Squiggle plot chart",
    width: 500,
    height: 100,
    padding: 5,
    data: [{ name: "data" }, { name: "domain" }],
    signals: [
      {
        name: "hover",
        value: null,
        on: [
          { events: "mouseover", update: "datum" },
          { events: "mouseout", update: "null" },
        ],
      },
      {
        name: "position",
        value: "[0, 0]",
        on: [
          { events: "mousemove", update: "xy() " },
          { events: "mouseout", update: "null" },
        ],
      },
      {
        name: "position_scaled",
        value: null,
        update: "isArray(position) ? invert('xscale', position[0]) : ''",
      },
    ],
    scales: [
      xScale,
      timeYScale,
      {
        name: "color",
        type: "ordinal",
        domain: {
          data: "data",
          field: "name",
        },
        range: { scheme: "blues" },
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
        tickCount: 3,
        labelOverlap: "greedy",
      },
    ],
    marks: [
      {
        name: "sample_distributions",
        type: "group",
        from: {
          facet: {
            name: "distribution_facet",
            data: "domain",
            groupby: ["name"],
          },
        },
        marks: [
          {
            name: "samples",
            type: "rect",
            from: { data: "distribution_facet" },
            encode: {
              enter: {
                x: { scale: "xscale", field: "dateTime" },
                width: { value: 0.5 },

                y: { value: 25, offset: { signal: "height" } },
                height: { value: 5 },
                fill: { value: "steelblue" },
                fillOpacity: { value: 0.8 },
              },
            },
          },
        ],
      },
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
                    // interpolate: { value: "linear" },
                    x: {
                      scale: "xscale",
                      field: "dateTime",
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
                      field: "dateTime",
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
                      signal:
                        "{ probability: datum.y, value: datetime(datum.dateTime) }",
                    },
                  },
                  update: {
                    x: {
                      scale: "xscale",
                      field: "dateTime",
                      offset: 0.5, // if this is not included, the circles are slightly left of center.
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
      {
        type: "text",
        interactive: false,
        encode: {
          enter: {
            text: {
              signal: "",
            },
            x: { signal: "width", offset: 1 },
            fill: { value: "black" },
            fontSize: { value: 20 },
            align: { value: "right" },
          },
          update: {
            text: {
              signal:
                "position_scaled ? utcyear(position_scaled) + '-' + utcmonth(position_scaled) + '-' + utcdate(position_scaled) + 'T' + utchours(position_scaled)+':' +utcminutes(position_scaled) : ''",
            },
          },
        },
      },
      {
        type: "rule",
        encode: {
          enter: {
            x: { value: 0 },
            y: { scale: "yscale", value: 0 },

            y2: {
              signal: "height",
              offset: 2,
            },
            strokeDash: { value: [5, 5] },
          },

          update: {
            x: {
              signal:
                "position ? position[0] < 0 ? null : position[0] > width ? null : position[0]: null",
            },

            opacity: { signal: "position ? 1 : 0" },
          },
        },
      },
    ],
    legends: [
      {
        fill: "color",
        orient: "top",
        labelFontSize: 12,
        encode: {
          symbols: {
            update: {
              fill: [
                { test: "length(domain('color')) == 1", value: "transparent" },
                { scale: "color", field: "value" },
              ],
            },
          },
          labels: {
            interactive: true,
            update: {
              fill: [
                { test: "length(domain('color')) == 1", value: "transparent" },
                { value: "black" },
              ],
            },
          },
        },
      },
    ],
    ...(title && {
      title: {
        text: title,
      },
    }),
  };

  return spec;
}
