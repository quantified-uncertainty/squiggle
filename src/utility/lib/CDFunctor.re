module type Config = {let shape: DistributionTypes.xyShape;};

exception ShapeWrong(string);

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

  let order = (): DistributionTypes.xyShape => {
    let xy =
      Config.shape.xs
      |> Array.mapi((i, x) => [x, Config.shape.ys[i]])
      |> Belt.SortArray.stableSortBy(_, ([a], [b]) => a > b ? (-1) : 1);
    {xs: xy |> Array.map(([x]) => x), ys: xy |> Array.map(([_, y]) => y)};
  };
};
