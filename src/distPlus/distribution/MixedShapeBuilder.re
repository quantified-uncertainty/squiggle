type assumption =
  | ADDS_TO_1
  | ADDS_TO_CORRECT_PROBABILITY;

type assumptions = {
  continuous: assumption,
  discrete: assumption,
  discreteProbabilityMass: option(float),
};

let buildSimple = (~continuous: option(DistTypes.continuousShape), ~discrete: option(DistTypes.discreteShape)): option(DistTypes.shape) => {
  let continuous = continuous |> E.O.default(Continuous.make(`Linear, {xs: [||], ys: [||]}, Some(0.0), None));
  let discrete = discrete |> E.O.default(Discrete.make({xs: [||], ys: [||]}, Some(0.0), None));
  let cLength =
    continuous
    |> Continuous.getShape
    |> XYShape.T.xs
    |> E.A.length;
  let dLength = discrete |> Discrete.getShape |> XYShape.T.xs |> E.A.length;
  switch (cLength, dLength) {
  | (0 | 1, 0) => None
  | (0 | 1, _) => Some(Discrete(discrete))
  | (_, 0) => Some(Continuous(continuous))
  | (_, _) =>
    let mixedDist =
      Mixed.make(
        ~continuous,
        ~discrete,
        None,
        None,
      );
    Some(Mixed(mixedDist));
  };
};
