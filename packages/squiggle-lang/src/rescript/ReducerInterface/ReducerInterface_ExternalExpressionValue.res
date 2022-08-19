/*
  Irreducible values. Reducer does not know about those. Only used for external calls
  This is a configuration to to make external calls of those types
*/
module Extra_Array = Reducer_Extra_Array
module ErrorValue = Reducer_ErrorValue
@genType.opaque
type internalCode = Object

@genType.opaque
type hiddenNameSpace = Object

@genType
type rec externalExpressionValue =
  | EvArray(array<externalExpressionValue>)
  | EvArrayString(array<string>)
  | EvBool(bool)
  | EvCall(string) // External function call
  | EvDate(Js.Date.t)
  | EvDeclaration(lambdaDeclaration)
  | EvDistribution(DistributionTypes.genericDist)
  | EvLambda(lambdaValue)
  | EvModule(record)
  | EvNumber(float)
  | EvRecord(record)
  | EvString(string)
  | EvSymbol(string)
  | EvTimeDuration(float)
  | EvType(record)
  | EvTypeIdentifier(string)
  | EvVoid
and record = Js.Dict.t<externalExpressionValue>
and lambdaValue = {
  parameters: array<string>,
  context: hiddenNameSpace,
  body: internalCode,
}
and lambdaDeclaration = Declaration.declaration<lambdaValue>

@genType
type externalBindings = record

@genType
type t = externalExpressionValue

type functionCall = (string, array<externalExpressionValue>)

let rec toString = aValue =>
  switch aValue {
  | EvArray(anArray) => {
      let args = anArray->Js.Array2.map(each => toString(each))->Js.Array2.toString
      `[${args}]`
    }
  | EvArrayString(anArray) => {
      let args = anArray->Js.Array2.toString
      `[${args}]`
    }
  | EvBool(aBool) => Js.String.make(aBool)
  | EvCall(fName) => `:${fName}`
  | EvDate(date) => DateTime.Date.toString(date)
  | EvDeclaration(d) => Declaration.toString(d, r => toString(EvLambda(r)))
  | EvDistribution(dist) => GenericDist.toString(dist)
  | EvLambda(lambdaValue) => `lambda(${Js.Array2.toString(lambdaValue.parameters)}=>internal code)`
  | EvModule(m) => `@${m->toStringRecord}`
  | EvNumber(aNumber) => Js.String.make(aNumber)
  | EvRecord(aRecord) => aRecord->toStringRecord
  | EvString(aString) => `'${aString}'`
  | EvSymbol(aString) => `:${aString}`
  | EvTimeDuration(t) => DateTime.Duration.toString(t)
  | EvType(t) => `type${t->toStringRecord}`
  | EvTypeIdentifier(id) => `#${id}`
  | EvVoid => `()`
  }
and toStringRecord = aRecord => {
  let pairs =
    aRecord
    ->Js.Dict.entries
    ->Js.Array2.map(((eachKey, eachValue)) => `${eachKey}: ${toString(eachValue)}`)
    ->Js.Array2.toString
  `{${pairs}}`
}

let argsToString = (args: array<externalExpressionValue>): string => {
  args->Js.Array2.map(arg => arg->toString)->Js.Array2.toString
}

let toStringFunctionCall = ((fn, args)): string => `${fn}(${argsToString(args)})`

let toStringResult = x =>
  switch x {
  | Ok(a) => `Ok(${toString(a)})`
  | Error(m) => `Error(${ErrorValue.errorToString(m)})`
  }

let toStringOptionResult = x =>
  switch x {
  | Some(a) => toStringResult(a)
  | None => `None`
  }

let toStringOption = x =>
  switch x {
  | Some(a) => toString(a)
  | None => `None`
  }

@genType
type environment = GenericDist.env

@genType
let defaultEnvironment: environment = DistributionOperation.defaultEnv
