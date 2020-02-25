module type Config = {let shape: DistTypes.xyShape;};

exception ShapeWrong(string);

let order = (shape: DistTypes.xyShape): DistTypes.xyShape => {
  let xy =
    shape.xs
    |> Array.mapi((i, x) => [x, shape.ys |> Array.get(_, i)])
    |> Belt.SortArray.stableSortBy(_, ([a, _], [b, _]) => a > b ? 1 : (-1));
  {
    xs: xy |> Array.map(([x, _]) => x),
    ys: xy |> Array.map(([_, y]) => y),
  };
};

module Make = (Config: Config) => {
  let xs = Config.shape.xs;
  let ys = Config.shape.ys;
  let get = Array.get;
  let len = Array.length;

  let validateHasLength = (): bool => len(xs) > 0;
  let validateSize = (): bool => len(xs) == len(ys);
  if (!validateHasLength()) {
    raise(ShapeWrong("You need at least one element."));
  };
  if (!validateSize()) {
    raise(ShapeWrong("Arrays of \"xs\" and \"ys\" have different sizes."));
  };
  if (!Belt.SortArray.isSorted(xs, (a, b) => a > b ? 1 : (-1))) {
    raise(ShapeWrong("Arrays of \"xs\" and \"ys\" have different sizes."));
  };
  let minX = () => get(xs, 0);
  let maxX = () => get(xs, len(xs) - 1);
  let minY = () => get(ys, 0);
  let maxY = () => get(ys, len(ys) - 1);
  let findY = (x: float): float => {
    let firstHigherIndex = Belt.Array.getIndexBy(xs, e => e >= x);
    switch (firstHigherIndex) {
    | None => maxY()
    | Some(0) => minY()
    | Some(firstHigherIndex) =>
      let lowerOrEqualIndex =
        firstHigherIndex - 1 < 0 ? 0 : firstHigherIndex - 1;
      let needsInterpolation = get(xs, lowerOrEqualIndex) != x;
      if (needsInterpolation) {
        Functions.interpolate(
          get(xs, lowerOrEqualIndex),
          get(xs, firstHigherIndex),
          get(ys, lowerOrEqualIndex),
          get(ys, firstHigherIndex),
          x,
        );
      } else {
        ys[lowerOrEqualIndex];
      };
    };
  };
  let findX = (y: float): float => {
    let firstHigherIndex = Belt.Array.getIndexBy(ys, e => e >= y);
    switch (firstHigherIndex) {
    | None => maxX()
    | Some(0) => minX()
    | Some(firstHigherIndex) =>
      let lowerOrEqualIndex =
        firstHigherIndex - 1 < 0 ? 0 : firstHigherIndex - 1;
      let needsInterpolation = get(ys, lowerOrEqualIndex) != y;
      if (needsInterpolation) {
        Functions.interpolate(
          get(ys, lowerOrEqualIndex),
          get(ys, firstHigherIndex),
          get(xs, lowerOrEqualIndex),
          get(xs, firstHigherIndex),
          y,
        );
      } else {
        xs[lowerOrEqualIndex];
      };
    };
  };
  1;
};
