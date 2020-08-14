open TypeSystem;

let wrongInputsError = (r) => {Js.log2("Wrong inputs", r); Error("Wrong inputs")};

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
  Function.make(
    ~name,
    ~output=`SamplingDistribution,
    ~inputs=[|`Float, `Float|],
    ~run=
      fun
      | [|`Float(a), `Float(b)|] => Ok(`SymbolicDist(fn(a, b)))
      | e => wrongInputsError(e)
  );

let makeSymbolicFromOneFloat = (name, fn) =>
  Function.make(
    ~name,
    ~output=`SamplingDistribution,
    ~inputs=[|`Float|],
    ~run=
      fun
      | [|`Float(a)|] => Ok(`SymbolicDist(fn(a)))
      | e => wrongInputsError(e)
  );

let makeDistFloat = (name, fn) => 
  Function.make(
    ~name,
    ~output=`SamplingDistribution,
    ~inputs=[|`SamplingDistribution, `Float|],
    ~run=
      fun
      | [|`SamplingDist(a), `Float(b)|] => (fn(a,b))
      | e => wrongInputsError(e)
  );

let makeDist = (name, fn) => 
  Function.make(
    ~name,
    ~output=`SamplingDistribution,
    ~inputs=[|`SamplingDistribution|],
    ~run=
      fun
      | [|`SamplingDist(a)|] => fn(a)
      | e => wrongInputsError(e)
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
  Function.make(
    ~name="to",
    ~output=`SamplingDistribution,
    ~inputs=[|`Float, `Float|],
    ~run=
      fun
      | [|`Float(a), `Float(b)|] => to_(a,b)
      | e => wrongInputsError(e)
  ),
  Function.make(
    ~name="triangular",
    ~output=`SamplingDistribution,
    ~inputs=[|`Float, `Float, `Float|],
    ~run=
      fun
      | [|`Float(a), `Float(b), `Float(c)|] =>
        SymbolicDist.Triangular.make(a, b, c)
        |> E.R.fmap(r => `SymbolicDist(r))
      | e => wrongInputsError(e)
  ),
  makeDistFloat("pdf", (dist, float) => floatFromDist(`Pdf(float), dist)),
  makeDistFloat("inv", (dist, float) => floatFromDist(`Inv(float), dist)),
  makeDistFloat("cdf", (dist, float) => floatFromDist(`Cdf(float), dist)),
  makeDist("mean", (dist) => floatFromDist(`Mean, dist)),
  makeDist("sample", (dist) => floatFromDist(`Sample, dist))
|];
