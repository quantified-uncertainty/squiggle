let runSymbolic =
    (guesstimatorString, length) =>{
      let graph = MathJsParser.fromString(guesstimatorString);
      graph |> E.R.fmap(g => RenderTypes.ShapeRenderer.Symbolic.make(g, SymbolicDist.toShape(length,g)))
    }
  
let getShape = (r: RenderTypes.ShapeRenderer.Combined.outputs) =>
  switch (r.symbolic, r.sampling) {
  | (Some(Ok({shape})), _) => Some(shape)
  | (_, Some({shape})) => shape
  | _ => None
  };

let run =
    (
      inputs: RenderTypes.ShapeRenderer.Combined.inputs
    )
    : RenderTypes.ShapeRenderer.Combined.outputs => {
  let symbolic = runSymbolic(inputs.guesstimatorString, inputs.symbolicInputs.length);
  let sampling =
    switch (symbolic) {
    | Ok(r) => None
    | Error(r) =>
      Samples.T.fromGuesstimatorString(
        ~guesstimatorString=inputs.guesstimatorString,
        ~samplingInputs=inputs.samplingInputs,
        (),
      )
    };
  {symbolic: Some(symbolic), sampling};
};