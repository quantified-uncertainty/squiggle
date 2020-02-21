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
};
