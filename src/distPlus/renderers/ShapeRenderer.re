let runSymbolic =
    (guesstimatorString, length) =>{
      let graph = MathJsParser.fromString(guesstimatorString);
      graph |> E.R.fmap(g => RenderTypes.ShapeRenderer.Symbolic.make(g, SymbolicDist.toShape(length,g)))
    }
  
let run =
    (
      inputs: RenderTypes.ShapeRenderer.Combined.inputs
    )
    : RenderTypes.ShapeRenderer.Combined.outputs => {
  let symbolic = runSymbolic(inputs.guesstimatorString, inputs.symbolicInputs.length);
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
  {symbolic: Some(symbolic), sampling};
};