type environment = Env.env

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

@genType.opaque
and expression = {
  ast: Reducer_Peggy_Parse.ast,
  content: expressionContent,
}

@genType.opaque and namespace = Belt.Map.String.t<value>
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

@genType
and context = {
  bindings: bindings,
  environment: environment,
  frameStack: frameStack,
  inFunction: option<lambdaValue>,
}

@genType and reducerFn = (expression, context) => (value, context)

let topFrameName = "<top>"
