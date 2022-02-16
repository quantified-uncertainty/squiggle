open ASTTypes.AST

let toString = ASTTypes.AST.Node.toString

let envs = (samplingInputs, environment) => {
  samplingInputs: samplingInputs,
  environment: environment,
  evaluateNode: ASTEvaluator.toLeaf,
}

let toLeaf = (samplingInputs, environment, node: node) =>
  ASTEvaluator.toLeaf(envs(samplingInputs, environment), node)

let toPointSetDist = (samplingInputs, environment, node: node) =>
  switch toLeaf(samplingInputs, environment, node) {
  | Ok(#RenderedDist(pointSetDist)) => Ok(pointSetDist)
  | Ok(_) => Error("Rendering failed.")
  | Error(e) => Error(e)
  }

let runFunction = (samplingInputs, environment, inputs, fn: PTypes.Function.t) => {
  let params = envs(samplingInputs, environment)
  PTypes.Function.run(params, inputs, fn)
}
