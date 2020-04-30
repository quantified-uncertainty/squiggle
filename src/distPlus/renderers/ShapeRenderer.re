// This transforms an array intersperced with spaces or newlines with a normally formatted one.
// "3 4 5 3 2 1 " -> "[3,4,5,3,2,1]""
let formatMessyArray = str => {
  let split = Js.String.splitByRe([%re "/\\n|\\r|\\s/"], str);
  if (E.A.length(split) > 20) {
    let inner = split |> Js.Array.joinWith(",");
    {j|[$inner]|j};
  } else {
    str;
  };
};

let formatString = str => {
  str |> formatMessyArray;
};

let runSymbolic = (guesstimatorString, length) => {
  let str = formatString(guesstimatorString);
  let graph = MathJsParser.fromString(str);
  graph
  |> E.R.fmap(g =>
       RenderTypes.ShapeRenderer.Symbolic.make(
         g,
         SymbolicDist.toShape(length, g),
       )
     );
};

let run =
    (inputs: RenderTypes.ShapeRenderer.Combined.inputs)
    : RenderTypes.ShapeRenderer.Combined.outputs => {
  let symbolic =
    runSymbolic(inputs.guesstimatorString, inputs.symbolicInputs.length);
  let sampling =
    switch (symbolic) {
    | Ok(_) => None
    | Error(_) =>
      Samples.T.fromGuesstimatorString(
        ~guesstimatorString=inputs.guesstimatorString,
        ~samplingInputs=inputs.samplingInputs,
        (),
      )
    };
  Js.log3("IS SOME?", symbolic |> E.R.toOption |> E.O.isSome, symbolic);
  {symbolic: Some(symbolic), sampling};
};