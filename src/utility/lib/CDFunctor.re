module type Config = {let shape: DistributionTypes.xyShape;};

module Make = (Config: Config) => {
  let validateHasLength = (): bool => Array.length(Config.shape.xs) > 0;
  let validateSize = (): bool =>
    Array.length(Config.shape.xs) == Array.length(Config.shape.ys);
};
