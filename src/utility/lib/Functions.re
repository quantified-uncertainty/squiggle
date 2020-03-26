let interpolate =
    (xMin: float, xMax: float, yMin: float, yMax: float, xIntended: float)
    : float => {
  let minProportion = (xMax -. xIntended) /. (xMax -. xMin);
  let maxProportion = (xIntended -. xMin) /. (xMax -. xMin);
  yMin *. minProportion +. yMax *. maxProportion;
};