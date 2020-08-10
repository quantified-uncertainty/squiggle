type node = ExpressionTypes.ExpressionTree.node;

let toOkSym = r => Ok(`SymbolicDist(r));
let getFloat = ExpressionTypes.ExpressionTree.getFloat;

let twoFloats = (fn, n1: node, n2: node): result(node, string) =>
  switch (getFloat(n1), getFloat(n2)) {
  | (Some(a), Some(b)) => fn(a, b)
  | _ => Error("Function needed two floats, missing them.")
  };

let threeFloats = (fn, n1: node, n2: node, n3: node): result(node, string) =>
  switch (getFloat(n1), getFloat(n2), getFloat(n3)) {
  | (Some(a), Some(b), Some(c)) => fn(a, b, c)
  | _ => Error("Variables have wrong type")
  };

let twoFloatsToOkSym = fn => twoFloats((f1, f2) => fn(f1, f2) |> toOkSym);

let threeFloats = fn => threeFloats((f1, f2, f3) => fn(f1, f2, f3));

let apply2 = (fn, args): result(node, string) =>
  switch (args) {
  | [|a, b|] => fn(a, b)
  | _ => Error("Needs 2 args")
  };

let apply3 = (fn, args: array(node)): result(node, string) =>
  switch (args) {
  | [|a, b, c|] => fn(a, b, c)
  | _ => Error("Needs 3 args")
  };

let to_: (float, float) => result(node, string) =
  (low, high) =>
    switch (low, high) {
    | (low, high) when low <= 0.0 && low < high =>
      Ok(`SymbolicDist(SymbolicDist.Normal.from90PercentCI(low, high)))
    | (low, high) when low < high =>
      Ok(`SymbolicDist(SymbolicDist.Lognormal.from90PercentCI(low, high)))
    | (low, high) => Error("Low value must be less than high value.")
    };

// Possible setup:
// let normal = {"inputs": [`float, `float], "outputs": [`float]};
// let render = {"inputs": [`dist], "outputs": [`renderedDist]};
// let render = {"inputs": [`distRenderedDist], "outputs": [`renderedDist]};

let fnn =
    (
      evaluationParams: ExpressionTypes.ExpressionTree.evaluationParams,
      name,
      args: array(node),
    ) =>
  switch (
    name,
    ExpressionTypes.ExpressionTree.Environment.get(
      evaluationParams.environment,
      name,
    ),
  ) {
  | (_, Some(`Function(argNames, tt))) =>
    PTypes.Function.run(evaluationParams, args, (argNames, tt))
  | ("normal", _) =>
    apply2(twoFloatsToOkSym(SymbolicDist.Normal.make), args)
  | ("uniform", _) =>
    apply2(twoFloatsToOkSym(SymbolicDist.Uniform.make), args)
  | ("beta", _) => apply2(twoFloatsToOkSym(SymbolicDist.Beta.make), args)
  | ("cauchy", _) =>
    apply2(twoFloatsToOkSym(SymbolicDist.Cauchy.make), args)
  | ("lognormal", _) =>
    apply2(twoFloatsToOkSym(SymbolicDist.Lognormal.make), args)
  | ("lognormalFromMeanAndStdDev", _) =>
    apply2(twoFloatsToOkSym(SymbolicDist.Lognormal.fromMeanAndStdev), args)
  | ("exponential", _) =>
    switch (args) {
    | [|`SymbolicDist(`Float(a))|] =>
      Ok(`SymbolicDist(SymbolicDist.Exponential.make(a)))
    | _ => Error("Needs 3 valid arguments")
    }
  | ("triangular", _) =>
    switch (args |> E.A.fmap(getFloat)) {
    | [|Some(a), Some(b), Some(c)|] =>
      SymbolicDist.Triangular.make(a, b, c)
      |> E.R.fmap(r => `SymbolicDist(r))
    | _ => Error("Needs 3 valid arguments")
    }
  | ("to", _) => apply2(twoFloats(to_), args)
  | ("pdf", _) =>
    switch (args) {
    | [|fst, snd|] =>
      switch (
        PTypes.SamplingDistribution.renderIfIsNotSamplingDistribution(
          evaluationParams,
          fst,
        ),
        getFloat(snd),
      ) {
      | (Ok(fst), Some(flt)) => Ok(`FloatFromDist((`Pdf(flt), fst)))
      | _ => Error("Incorrect arguments")
      }
    | _ => Error("Needs two args")
    }
  | ("inv", _) =>
    switch (args) {
    | [|fst, snd|] =>
      switch (
        PTypes.SamplingDistribution.renderIfIsNotSamplingDistribution(
          evaluationParams,
          fst,
        ),
        getFloat(snd),
      ) {
      | (Ok(fst), Some(flt)) => Ok(`FloatFromDist((`Inv(flt), fst)))
      | _ => Error("Incorrect arguments")
      }
    | _ => Error("Needs two args")
    }
  | ("cdf", _) =>
    switch (args) {
    | [|fst, snd|] =>
      switch (
        PTypes.SamplingDistribution.renderIfIsNotSamplingDistribution(
          evaluationParams,
          fst,
        ),
        getFloat(snd),
      ) {
      | (Ok(fst), Some(flt)) => Ok(`FloatFromDist((`Cdf(flt), fst)))
      | _ => Error("Incorrect arguments")
      }
    | _ => Error("Needs two args")
    }
  | ("mean", _) =>
    switch (args) {
    | [|fst|] =>
      switch (
        PTypes.SamplingDistribution.renderIfIsNotSamplingDistribution(
          evaluationParams,
          fst,
        )
      ) {
      | Ok(fst) => Ok(`FloatFromDist((`Mean, fst)))
      | _ => Error("Incorrect arguments")
      }
    | _ => Error("Needs two args")
    }
  | ("sample", _) =>
    switch (args) {
    | [|fst|] =>
      switch (
        PTypes.SamplingDistribution.renderIfIsNotSamplingDistribution(
          evaluationParams,
          fst,
        )
      ) {
      | Ok(fst) => Ok(`FloatFromDist((`Sample, fst)))
      | _ => Error("Incorrect arguments")
      }
    | _ => Error("Needs two args")
    }
  | ("mm", _)
  | ("multimodal", _) =>
    switch (args |> E.A.to_list) {
    | [`Array(weights), ...dists] =>
      let withWeights =
        dists
        |> E.L.toArray
        |> E.A.fmapi((index, t) => {
             let w =
               weights
               |> E.A.get(_, index)
               |> E.O.bind(_, getFloat)
               |> E.O.default(1.0);
             (t, w);
           });
      Ok(`MultiModal(withWeights));
    | dists when E.L.length(dists) > 0 =>
      Ok(`MultiModal(dists |> E.L.toArray |> E.A.fmap(r => (r, 1.0))))
    | _ => Error("Needs at least one distribution")
    }
  | _ => Error("Function " ++ name ++ " not found")
  };
