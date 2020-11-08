open TypeSystem;

let wrongInputsError = r => {
  Error("Wrong inputs");
};

let to_: (float, float) => result(node, string) =
  (low, high) =>
    switch (low, high) {
    | (low, high) when low <= 0.0 && low < high =>
      Ok(`SymbolicDist(SymbolicDist.Normal.from90PercentCI(low, high)))
    | (low, high) when low < high =>
      Ok(`SymbolicDist(SymbolicDist.Lognormal.from90PercentCI(low, high)))
    | (_, _) => Error("Low value must be less than high value.")
    };

let makeSymbolicFromTwoFloats = (name, fn) =>
  Function.T.make(
    ~name,
    ~outputType=`SamplingDistribution,
    ~inputTypes=[|`Float, `Float|],
    ~run=
      fun
      | [|`Float(a), `Float(b)|] => Ok(`SymbolicDist(fn(a, b)))
      | e => wrongInputsError(e),
    (),
  );

let makeSymbolicFromOneFloat = (name, fn) =>
  Function.T.make(
    ~name,
    ~outputType=`SamplingDistribution,
    ~inputTypes=[|`Float|],
    ~run=
      fun
      | [|`Float(a)|] => Ok(`SymbolicDist(fn(a)))
      | e => wrongInputsError(e),
    (),
  );

let makeDistFloat = (name, fn) =>
  Function.T.make(
    ~name,
    ~outputType=`SamplingDistribution,
    ~inputTypes=[|`SamplingDistribution, `Float|],
    ~run=
      fun
      | [|`SamplingDist(a), `Float(b)|] => fn(a, b)
      | e => wrongInputsError(e),
    (),
  );

let makeRenderedDistFloat = (name, fn) =>
  Function.T.make(
    ~name,
    ~outputType=`RenderedDistribution,
    ~inputTypes=[|`RenderedDistribution, `Float|],
    ~run=
      fun
      | [|`RenderedDist(a), `Float(b)|] => fn(a, b)
      | e => wrongInputsError(e),
    (),
  );

let makeDist = (name, fn) =>
  Function.T.make(
    ~name,
    ~outputType=`SamplingDistribution,
    ~inputTypes=[|`SamplingDistribution|],
    ~run=
      fun
      | [|`SamplingDist(a)|] => fn(a)
      | e => wrongInputsError(e),
    (),
  );

let floatFromDist =
    (
      distToFloatOp: ExpressionTypes.distToFloatOperation,
      t: TypeSystem.samplingDist,
    )
    : result(node, string) => {
  switch (t) {
  | `SymbolicDist(s) =>
    SymbolicDist.T.operate(distToFloatOp, s)
    |> E.R.bind(_, v => Ok(`SymbolicDist(`Float(v))))
  | `RenderedDist(rs) =>
    Shape.operate(distToFloatOp, rs) |> (v => Ok(`SymbolicDist(`Float(v))))
  };
};

let verticalScaling = (scaleOp, rs, scaleBy) => {
  // scaleBy has to be a single float, otherwise we'll return an error.
  let fn = (secondary, main) =>
    Operation.Scale.toFn(scaleOp, main, secondary);
  let integralSumCacheFn = Operation.Scale.toIntegralSumCacheFn(scaleOp);
  let integralCacheFn = Operation.Scale.toIntegralCacheFn(scaleOp);
  Ok(
    `RenderedDist(
      Shape.T.mapY(
        ~integralSumCacheFn=integralSumCacheFn(scaleBy),
        ~integralCacheFn=integralCacheFn(scaleBy),
        ~fn=fn(scaleBy),
        rs,
      ),
    ),
  );
};

let functions = [|
  makeSymbolicFromTwoFloats("normal", SymbolicDist.Normal.make),
  makeSymbolicFromTwoFloats("uniform", SymbolicDist.Uniform.make),
  makeSymbolicFromTwoFloats("beta", SymbolicDist.Beta.make),
  makeSymbolicFromTwoFloats("lognormal", SymbolicDist.Lognormal.make),
  makeSymbolicFromTwoFloats(
    "lognormalFromMeanAndStdDev",
    SymbolicDist.Lognormal.fromMeanAndStdev,
  ),
  makeSymbolicFromOneFloat("exponential", SymbolicDist.Exponential.make),
  Function.T.make(
    ~name="to",
    ~outputType=`SamplingDistribution,
    ~inputTypes=[|`Float, `Float|],
    ~run=
      fun
      | [|`Float(a), `Float(b)|] => to_(a, b)
      | e => wrongInputsError(e),
    (),
  ),
  Function.T.make(
    ~name="triangular",
    ~outputType=`SamplingDistribution,
    ~inputTypes=[|`Float, `Float, `Float|],
    ~run=
      fun
      | [|`Float(a), `Float(b), `Float(c)|] =>
        SymbolicDist.Triangular.make(a, b, c)
        |> E.R.fmap(r => `SymbolicDist(r))
      | e => wrongInputsError(e),
    (),
  ),
  makeDistFloat("pdf", (dist, float) => floatFromDist(`Pdf(float), dist)),
  makeDistFloat("inv", (dist, float) => floatFromDist(`Inv(float), dist)),
  makeDistFloat("cdf", (dist, float) => floatFromDist(`Cdf(float), dist)),
  makeDist("mean", dist => floatFromDist(`Mean, dist)),
  makeDist("sample", dist => floatFromDist(`Sample, dist)),
  Function.T.make(
    ~name="render",
    ~outputType=`RenderedDistribution,
    ~inputTypes=[|`RenderedDistribution|],
    ~run=
      fun
      | [|`RenderedDist(c)|] => Ok(`RenderedDist(c))
      | e => wrongInputsError(e),
    (),
  ),
  Function.T.make(
    ~name="normalize",
    ~outputType=`SamplingDistribution,
    ~inputTypes=[|`SamplingDistribution|],
    ~run=
      fun
      | [|`SamplingDist(`SymbolicDist(c))|] => Ok(`SymbolicDist(c))
      | [|`SamplingDist(`RenderedDist(c))|] =>
        Ok(`RenderedDist(Shape.T.normalize(c)))
      | e => wrongInputsError(e),
    (),
  ),
  makeRenderedDistFloat("scaleExp", (dist, float) =>
    verticalScaling(`Exponentiate, dist, float)
  ),
  makeRenderedDistFloat("scaleMultiply", (dist, float) =>
    verticalScaling(`Multiply, dist, float)
  ),
  makeRenderedDistFloat("scaleLog", (dist, float) =>
    verticalScaling(`Log, dist, float)
  ),
  Function.T.make(
    ~name="multimodal",
    ~outputType=`SamplingDistribution,
    ~inputTypes=[|
      `Named([|
        ("dists", `Array(`SamplingDistribution)),
        ("weights", `Array(`Float)),
      |]),
    |],
    ~run=
      fun
      | [|`Named(r)|] => {
          let foo =
              (r: TypeSystem.typedValue)
              : result(ExpressionTypes.ExpressionTree.node, string) =>
            switch (r) {
            | `SamplingDist(`SymbolicDist(c)) => Ok(`SymbolicDist(c))
            | `SamplingDist(`RenderedDist(c)) => Ok(`RenderedDist(c))
            | `Float(x) =>
              Ok(`RenderedDist(SymbolicDist.T.toShape(1000, `Float(x))))
            | _ => Error("")
            };
          let weight = (r: TypeSystem.typedValue) =>
            switch (r) {
            | `Float(x) => Ok(x)
            | _ => Error("Wrong Type")
            };
          let dists =
            switch (ExpressionTypes.ExpressionTree.Hash.getByName(r, "dists")) {
            | Some(`Array(r)) => r |> E.A.fmap(foo) |> E.A.R.firstErrorOrOpen
            | _ => Error("")
            };
          let weights =
            (
              switch (
                ExpressionTypes.ExpressionTree.Hash.getByName(r, "weights")
              ) {
              | Some(`Array(r)) =>
                r |> E.A.fmap(weight) |> E.A.R.firstErrorOrOpen
              | _ => Error("")
              }
            )
            |> (
              fun
              | Ok(r) => r
              | _ => [||]
            );
          let withWeights =
            dists
            |> E.R.fmap(d => {
                 let iis =
                   d |> E.A.length |> Belt.Array.makeUninitializedUnsafe;
                 for (i in 0 to (d |> E.A.length) - 1) {
                   Belt.Array.set(
                     iis,
                     i,
                     (
                       E.A.unsafe_get(d, i),
                       E.A.get(weights, i) |> E.O.default(1.0),
                     ),
                   )
                   |> ignore;
                 };
                 iis;
               });
          let components: result(array(node), string) =
            withWeights
            |> E.R.fmap(
                 E.A.fmap(((dist, weight)) =>
                   `FunctionCall((
                     "scaleMultiply",
                     [|dist, `SymbolicDist(`Float(weight))|],
                   ))
                 ),
               );
          let pointwiseSum =
            components
            |> E.R.bind(_, r => {
                 E.A.length(r) > 0
                   ? Ok(r) : Error("Invalid argument length")
               })
            |> E.R.fmap(r =>
                 r
                 |> Js.Array.sliceFrom(1)
                 |> E.A.fold_left(
                      (acc, x) => {`PointwiseCombination((`Add, acc, x))},
                      E.A.unsafe_get(r, 0),
                    )
               );
          pointwiseSum;
        }
      | _ => Error(""),
    (),
  ),
|];
