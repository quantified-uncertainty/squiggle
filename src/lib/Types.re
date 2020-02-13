type distribution = {
  xs: array(float),
  ys: array(float),
};

let toComponentsDist = (d: distribution): ForetoldComponents.Types.Dist.t => {
  xs: d.xs,
  ys: d.ys,
};