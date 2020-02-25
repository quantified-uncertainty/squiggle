exception RangeWrong(string);

let interpolate =
    (xMin: float, xMax: float, yMin: float, yMax: float, xIntended: float)
    : float => {
  let minProportion = (xMax -. xIntended) /. (xMax -. xMin);
  let maxProportion = (xIntended -. xMin) /. (xMax -. xMin);
  yMin *. minProportion +. yMax *. maxProportion;
};

// @todo: To test!
let sum = Belt.Array.reduce(_, 0., (i, j) => i +. j);
let mean = a => sum(a) /. (Array.length(a) |> float_of_int);
let min = Belt.Array.reduce(_, 0., (i, j) => i < j ? i : j);
let max = Belt.Array.reduce(_, 0., (i, j) => i > j ? i : j);
let up = (a, b) => Array.make(b - a, a) |> Array.mapi((i, c) => c + i);
let down = (a, b) => Array.make(a - b, a) |> Array.mapi((i, c) => c - i);
let range = (min: float, max: float, n: int): array(float) => {
  switch (n) {
  | 0 => [||]
  | 1 => [|min|]
  | 2 => [|min, max|]
  | _ when min == max => Belt.Array.make(n, min)
  | _ when n < 0 => raise(RangeWrong("n is less then zero"))
  | _ when min > max => raise(RangeWrong("Min values is less then max"))
  | _ =>
    let diff = max -. min;
    Belt.Array.makeBy(n, i => float_of_int(i) *. diff);
  };
};
