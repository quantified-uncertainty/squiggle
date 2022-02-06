open TypeSystem;

let wrongInputsError = (r: array(typedValue)) => {
  let inputs = r |> E.A.fmap(TypedValue.toString) |>Js.String.concatMany(_, ",");
  Js.log3("Inputs were", inputs, r);
  Error("Wrong inputs. The inputs were:" ++ inputs);
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
      | [|`RenderedDist(a), `Float(b)|] => fn(`RenderedDist(a), b)
      | e => wrongInputsError(e),
    (),
  );

let makeRenderedDistFloat = (name, fn) =>
  Function.T.make(
    ~name,
    ~outputType=`RenderedDistribution,
    ~inputTypes=[|`RenderedDistribution, `Float|],
    ~shouldCoerceTypes=true,
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
      | [|`RenderedDist(a)|] => fn(`RenderedDist(a))
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

module Multimodal = {
  let getByNameResult = ExpressionTypes.ExpressionTree.Hash.getByNameResult;

  let _paramsToDistsAndWeights = (r: array(typedValue)) =>
    switch (r) {
    | [|`Hash(r)|] =>
      let dists =
        getByNameResult(r, "dists")
        ->E.R.bind(TypeSystem.TypedValue.toArray)
        ->E.R.bind(r =>
            r
            |> E.A.fmap(TypeSystem.TypedValue.toDist)
            |> E.A.R.firstErrorOrOpen
          );
      let weights =
        getByNameResult(r, "weights")
        ->E.R.bind(TypeSystem.TypedValue.toArray)
        ->E.R.bind(r =>
            r
            |> E.A.fmap(TypeSystem.TypedValue.toFloat)
            |> E.A.R.firstErrorOrOpen
          );

      E.R.merge(dists, weights)
      |> E.R.fmap(((a, b)) =>
           E.A.zipMaxLength(a, b)
           |> E.A.fmap(((a, b)) =>
                (a |> E.O.toExn(""), b |> E.O.default(1.0))
              )
         );
    | _ => Error("Needs items")
    };
  let _runner: array(typedValue) => result(node, string) =
    r => {
      let paramsToDistsAndWeights =
        _paramsToDistsAndWeights(r)
        |> E.R.fmap(
             E.A.fmap(((dist, weight)) =>
               `FunctionCall((
                 "scaleMultiply",
                 [|dist, `SymbolicDist(`Float(weight))|],
               ))
             ),
           );
      let pointwiseSum: result(node, string) =
        paramsToDistsAndWeights->E.R.bind(
          E.R.errorIfCondition(E.A.isEmpty, "Needs one input"),
        )
        |> E.R.fmap(r =>
             r
             |> Js.Array.sliceFrom(1)
             |> E.A.fold_left(
                  (acc, x) => {`PointwiseCombination((`Add, acc, x))},
                  E.A.unsafe_get(r, 0),
                )
           );
      pointwiseSum;
    };

  let _function =
    Function.T.make(
      ~name="multimodal",
      ~outputType=`SamplingDistribution,
      ~inputTypes=[|
        `Hash([|
          ("dists", `Array(`SamplingDistribution)),
          ("weights", `Array(`Float)),
        |]),
      |],
      ~run=_runner,
      (),
    );
};

let all = [|
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
  Multimodal._function
|];
