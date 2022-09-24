type environment = GenericDist.env

@genType.opaque
type rec value =
  | IEvArray(arrayValue)
  | IEvBool(bool)
  | IEvDate(Js.Date.t)
  | IEvDeclaration(lambdaDeclaration)
  | IEvDistribution(DistributionTypes.genericDist)
  | IEvLambda(lambdaValue)
  | IEvNumber(float)
  | IEvRecord(map)
  | IEvString(string)
  | IEvTimeDuration(float)
  | IEvVoid
@genType.opaque and arrayValue = array<value>
@genType.opaque and map = Belt.Map.String.t<value>
and lambdaBody = (array<value>, environment, reducerFn) => value
@genType.opaque
and lambdaValue = {
  parameters: array<string>,
  body: lambdaBody,
}
@genType.opaque and lambdaDeclaration = Declaration.declaration<lambdaValue>
and expression =
  | EBlock(array<expression>)
  // programs are similar to blocks, but don't create an inner scope. there can be only one program at the top level of the expression.
  | EProgram(array<expression>)
  | EArray(array<expression>)
  | ERecord(array<(expression, expression)>)
  | ESymbol(string)
  | ETernary(expression, expression, expression)
  | EAssign(string, expression)
  | ECall(expression, array<expression>)
  | ELambda(array<string>, expression)
  | EValue(value)

and namespace = Belt.Map.String.t<value>
and bindings = {
  namespace: namespace,
  parent: option<bindings>,
}

and context = {
  bindings: bindings,
  environment: environment,
}

and reducerFn = (expression, context) => (value, context)
