type expressionValue = ReducerInterface_ExpressionValue.expressionValue

type rec frType =
  | FRTypeNumber
  | FRTypeNumeric
  | FRTypeDistOrNumber
  | FRTypeRecord(frTypeRecord)
  | FRTypeArray(array<frType>)
  | FRTypeOption(frType)
and frTypeRecord = array<frTypeRecordParam>
and frTypeRecordParam = (string, frType)

type rec frValue =
  | FRValueNumber(float)
  | FRValueDist(DistributionTypes.genericDist)
  | FRValueOption(option<frValue>)
  | FRValueDistOrNumber(frValueDistOrNumber)
  | FRValueRecord(frValueRecord)
and frValueRecord = array<frValueRecordParam>
and frValueRecordParam = (string, frValue)
and frValueDistOrNumber = FRValueNumber(float) | FRValueDist(DistributionTypes.genericDist)

type fnDefinition = {
  name: string,
  inputs: array<frType>,
  run: (array<frValue>, DistributionOperation.env) => result<expressionValue, string>,
}

type function = {
  name: string,
  definitions: array<fnDefinition>,
}

type registry = array<function>


// Note: The function "name" is just used for documentation purposes
module Function: {
  type t = function
  let make: (~name: string, ~definitions: array<fnDefinition>) => t
}

module FnDefinition: {
  type t = fnDefinition
  let make: (
    ~name: string,
    ~inputs: array<frType>,
    ~run: (array<frValue>, DistributionOperation.env) => result<expressionValue, string>,
  ) => t
}

module Registry: {
  let matchAndRun: (
    ~registry: registry,
    ~fnName: string,
    ~args: array<expressionValue>,
    ~env: QuriSquiggleLang.DistributionOperation.env,
  ) => option<result<expressionValue, string>>
}
