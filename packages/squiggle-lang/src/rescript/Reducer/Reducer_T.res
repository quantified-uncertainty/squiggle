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
and lambdaBody = (array<value>, context, reducerFn) => value
@genType.opaque
and lambdaValue =
  | FnLambda({
      parameters: array<string>,
      body: lambdaBody,
      location: Reducer_Peggy_Parse.location,
      name: option<string>,
    })
  | FnBuiltin({body: lambdaBody, name: string})
@genType.opaque and lambdaDeclaration = Declaration.declaration<lambdaValue>
and expressionContent =
  | EBlock(array<expression>)
  // programs are similar to blocks, but don't create an inner scope. there can be only one program at the top level of the expression.
  | EProgram(array<expression>)
  | EArray(array<expression>)
  | ERecord(array<(expression, expression)>)
  | ESymbol(string)
  | ETernary(expression, expression, expression)
  | EAssign(string, expression)
  | ECall(expression, array<expression>)
  | ELambda(array<string>, expression, option<string>)
  | EValue(value)

and expression = {
  ast: Reducer_Peggy_Parse.ast,
  content: expressionContent,
}

and namespace = Belt.Map.String.t<value>
and bindings = {
  namespace: namespace,
  parent: option<bindings>,
}

@genType.opaque
and frame = {
  name: string,
  location: option<Reducer_Peggy_Parse.location>, // can be empty for calls from builtin functions
}
@genType.opaque and frameStack = list<frame>

and context = {
  bindings: bindings,
  environment: environment,
  frameStack: frameStack,
  inFunction: option<lambdaValue>,
}

and reducerFn = (expression, context) => (value, context)

let topFrameName = "<top>"
