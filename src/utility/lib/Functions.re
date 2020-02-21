let interpolate =
    (xMin: float, xMax: float, yMin: float, yMax: float, xIntended: float)
    : float => {
  let minProportion = (xMax -. xIntended) /. (xMax -. xMin);
  let maxProportion = (xIntended -. xMin) /. (xMax -. xMin);
  yMin *. minProportion +. yMax *. maxProportion;
};

/* https://bucklescript.github.io/bucklescript/api/Belt.html */
let sum = Belt.Array.reduce(_, 0., (i, j) => i +. j);
let mean = a => sum(a) /. (Array.length(a) |> float_of_int);
let min = Belt.Array.reduce(_, 0., (i, j) => i < j ? i : j);
let max = Belt.Array.reduce(_, 0., (i, j) => i > j ? i : j);
