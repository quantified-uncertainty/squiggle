open ASTTypes.AST

let toString = ASTBasic.toString
let envs = (samplingInputs, environment) => {
  samplingInputs: samplingInputs,
  environment: environment,
  evaluateNode: ASTEvaluator.toLeaf,
}

let toLeaf = (samplingInputs, environment, node: node) =>
  ASTEvaluator.toLeaf(envs(samplingInputs, environment), node)
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
