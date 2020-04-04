let runSymbolic =
    (renderingInputs: RenderTypes.primaryInputs) =>{
      let graph = MathJsParser.fromString(renderingInputs.guesstimatorString);
      graph |> E.R.fmap(g => RenderTypes.Symbolic.make(g, SymbolicDist.toShape(renderingInputs.shapeLength,g)))
    }
  
let getShape = (r: RenderTypes.Combined.outputs) =>
  switch (r.symbolic, r.sampling) {
  | (Some(Ok({shape})), _) => Some(shape)
  | (_, Some({shape})) => shape
  | _ => None
  };

let run =
    (
      ~renderingInputs: RenderTypes.primaryInputs,
      ~samplingInputs: RenderTypes.Sampling.inputs,
    )
    : RenderTypes.Combined.outputs => {
  let symbolic = runSymbolic(renderingInputs);
  let sampling =
    switch (symbolic) {
    | Ok(r) => None
    | Error(r) =>
      Samples.T.fromGuesstimatorString(
        ~guesstimatorString=renderingInputs.guesstimatorString,
        ~samplingInputs,
        (),
      )
    };
  {symbolic: Some(symbolic), sampling};
};