import type { LogScale, LinearScale, PowScale } from "vega";
export let linearXScale: LinearScale = {
  name: "xscale",
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
