type distribution = {
  xs: array(float),
  ys: array(float),
};

let toComponentsDist = (d: distribution): ForetoldComponents.Types.Dist.t => {
  xs: d.xs,
  ys: d.ys,
};

type pdf = distribution;
type cdf = distribution;

let foo = (b: pdf) => 3.9;
let bar: cdf = {xs: [||], ys: [||]};

let cc = foo(bar);