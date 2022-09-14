type environment = GenericDist.env

@genType.opaque
type rec value =
  | IEvArray(arrayValue)
  | IEvArrayString(array<string>)
  | IEvBool(bool)
  | IEvDate(Js.Date.t)
  | IEvDeclaration(lambdaDeclaration)
  | IEvDistribution(DistributionTypes.genericDist)
  | IEvLambda(lambdaValue)
  | IEvBindings(nameSpace)
  | IEvNumber(float)
  | IEvRecord(map)
  | IEvString(string)
  | IEvTimeDuration(float)
  | IEvType(map)
  | IEvTypeIdentifier(string)
  | IEvVoid
@genType.opaque and arrayValue = array<value>
@genType.opaque and map = Belt.Map.String.t<value>
@genType.opaque and nameSpace = NameSpace(Belt.MutableMap.String.t<value>, option<nameSpace>)
and lambdaBody = (array<value>, environment, reducerFn) => value
@genType.opaque
and lambdaValue = {
  parameters: array<string>,
  body: (array<value>, environment, reducerFn) => value,
}
@genType.opaque and lambdaDeclaration = Declaration.declaration<lambdaValue>
and expression =
  | EBlock(array<expression>)
  | EProgram(array<expression>) // programs are similar to blocks, but don't create an inner scope. there can be only one program at the top level of the expression.
  | EArray(array<expression>)
  | ERecord(array<(expression, expression)>)
  | ESymbol(string)
  | ETernary(expression, expression, expression)
  | EAssign(string, expression)
  | ECall(expression, array<expression>)
  | ELambda(array<string>, expression)
  | EValue(value)

and context = {
  bindings: nameSpace,
  environment: environment,
}

and reducerFn = (expression, context) => value
