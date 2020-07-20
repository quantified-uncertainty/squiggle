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

let runSymbolic = (inputs: RenderTypes.ShapeRenderer.Combined.inputs) => {
  let str = formatString(inputs.guesstimatorString);
  let graph = MathJsParser.fromString(str);
  graph
  |> E.R.bind(_, g =>
       ExpressionTree.toShape(
         inputs.symbolicInputs.length,
         {
           sampleCount:
             inputs.samplingInputs.sampleCount |> E.O.default(10000),
           outputXYPoints:
             inputs.samplingInputs.outputXYPoints |> E.O.default(10000),
           kernelWidth: inputs.samplingInputs.kernelWidth,
         },
         g,
       )
       |> E.R.fmap(RenderTypes.ShapeRenderer.Symbolic.make(g))
     );
};

let run = (inputs: RenderTypes.ShapeRenderer.Combined.inputs) => {
  runSymbolic(inputs);
};
