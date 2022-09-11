open Jest
open Reducer_Peggy_TestHelpers

describe("Environment Accesss", () => {
  testToExpression(
    "environment",
    "{(:$_endOfOuterBlock_$ () (:$$_environment_$$))}",
    ~v=`{sampleCount: ${ReducerInterface_InternalExpressionValue.defaultEnvironment.sampleCount->Js.Int.toString},xyPointLength: ${ReducerInterface_InternalExpressionValue.defaultEnvironment.xyPointLength->Js.Int.toString}}`,
    (),
  )
  testToExpression(
    "withEnvironmentSampleCount(100, environment.sampleCount)",
    "{(:$_endOfOuterBlock_$ () (:$$_withEnvironmentSampleCount_$$ 100 (:$_atIndex_$ (:$$_environment_$$) 'sampleCount')))}",
    ~v="100",
    (),
  )
})
