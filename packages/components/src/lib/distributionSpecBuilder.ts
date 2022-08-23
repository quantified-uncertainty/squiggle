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

export function buildVegaSpec(
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
      {name: "data",},
      { name: "domain",},
    ],
    signals: [
      {
        "name": "hover",
        "value": null,
        "on": [
          {"events": "mouseover", "update": "datum"},
          {"events": "mouseout", "update": "null"}
        ]
      },
      {
        "name": "position",
        "value": "[0, 0]",
        "on": [
          { "events": "mousemove", "update": "hover ? xy() : null"},
          { "events": "mouseout", "update": "null"},
        ]
      },
 
      // {
      //   "name": "announcer",
      //   "value": "",
      //   "update": "hover ?  'Value: ' + hover.x : ''"
      // },
      
    
    ],
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
        tickCount: 10,
        labelOverlap: "greedy",
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
                "name": "samples",
                "type": "rect",
                "from": {"data": "discrete_facet"},
                "encode": {
                  "enter": {
                    "x": {"scale": "xscale", "field":"x"},
                    "width": {"value": 1},
        
                    "y": {"value": 25, "offset": {"signal": "height"}},
                    "height": {"value": 5},
                    "fill": {"value": "steelblue"},
                    "fillOpacity": {"value": 0.8}
                  }
                }
              },
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
        "type": "text",
        "interactive": false,
        "encode": {
          "enter": {
            "x": {"signal": "width", "offset": 1},
            "y": {"value": 0},
            "fill": {"value": "black"},
            "fontSize": {"value": 20},
            "align": {"value": "right"}
          },
          "update": {
            "text": {"signal": "position ? position[0]/width  : ''"}
          }
        }
      },
      // {
      //   "type": "rule",
      //   "encode": {
      //     "enter": {
      //       x: {value: 0},
      //       "y": {"scale": "yscale", "value":0},

      //       y2: {
      //        signal: "height",
      //        offset: 2
      //       },
      //       "strokeDash": {"value": [5, 5]}, 
      //      },
           
      //      "update": {
      //       "x": {"signal": "position[0] < 0 ? null : position[0] > width ? null : position[0]"},

      //       "opacity": {"signal": "position ? 1 : 0"}
      //     },
      //   }
        
      // }
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
