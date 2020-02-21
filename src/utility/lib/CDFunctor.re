module type Config = {let shape: DistributionTypes.xyShape;};

exception ShapeWrong(string);

let order = (shape: DistributionTypes.xyShape): DistributionTypes.xyShape => {
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
  let validateHasLength = (): bool => Array.length(Config.shape.xs) > 0;
  let validateSize = (): bool =>
    Array.length(Config.shape.xs) == Array.length(Config.shape.ys);
  if (!validateHasLength()) {
    raise(ShapeWrong("You need at least one element."));
  };
  if (!validateSize()) {
    raise(ShapeWrong("Arrays of \"xs\" and \"ys\" have different sizes."));
  };
  if (!Belt.SortArray.isSorted(Config.shape.xs, (a, b) => a > b ? 1 : (-1))) {
    raise(ShapeWrong("Arrays of \"xs\" and \"ys\" have different sizes."));
  };
  let minX = () => Config.shape.xs |> Array.get(_, 0);
  let maxX = () =>
    Config.shape.xs |> Array.get(_, Array.length(Config.shape.xs) - 1);
  1;
};
