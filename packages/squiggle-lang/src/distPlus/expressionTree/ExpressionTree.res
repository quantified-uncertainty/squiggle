open ExpressionTypes.ExpressionTree

let toString = ExpressionTreeBasic.toString
let envs = (samplingInputs, environment) => {
  samplingInputs: samplingInputs,
  environment: environment,
  evaluateNode: ExpressionTreeEvaluator.toLeaf,
}

let toLeaf = (samplingInputs, environment, node: node) =>
  ExpressionTreeEvaluator.toLeaf(envs(samplingInputs, environment), node)
let toShape = (samplingInputs, environment, node: node) =>
  switch toLeaf(samplingInputs, environment, node) {
  | Ok(#RenderedDist(shape)) => Ok(shape)
  | Ok(_) => Error("Rendering failed.")
  | Error(e) => Error(e)
  }

let runFunction = (samplingInputs, environment, inputs, fn: PTypes.Function.t) => {
  let params = envs(samplingInputs, environment)
  PTypes.Function.run(params, inputs, fn)
}
