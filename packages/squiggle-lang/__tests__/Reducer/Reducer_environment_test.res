open Jest
open Reducer_Peggy_TestHelpers

describe("Environment Accesss", () => {
  testToExpression(
    "Environment.sampleCount",
    "{(:$_endOfOuterBlock_$ () (:$_atIndex_$ (:$$_environment_$$) 'sampleCount'))}",
    ~v=ReducerInterface_InternalExpressionValue.defaultEnvironment.sampleCount->Js.Int.toString,
    (),
  )
  testToExpression(
    "Environment.withSampleCount(100, Environment.sampleCount)",
    "{(:$_endOfOuterBlock_$ () (:$$_withEnvironmentSampleCount_$$ 100 (:$_atIndex_$ (:$$_environment_$$) 'sampleCount')))}",
    ~v="100",
    (),
  )
  testToExpression(
    "Environment.withSampleCount(100, 99)",
    "{(:$_endOfOuterBlock_$ () (:$$_withEnvironmentSampleCount_$$ 100 99))}",
    ~v="99",
    (),
  )

  testToExpression(
    "f(x) = Environment.withSampleCount(999, Environment.sampleCount+1); f(1)",
    "{(:$_let_$ :f (:$$_lambda_$$ [x] {(:$$_withEnvironmentSampleCount_$$ 999 (:add (:$_atIndex_$ (:$$_environment_$$) 'sampleCount') 1))})); (:$_endOfOuterBlock_$ () (:f 1))}",
    ~v="1000",
    (),
  )

  testToExpression(
    "f(x) = Environment.sampleCount+1; Environment.withSampleCount(999, f(1))",
    "{(:$_let_$ :f (:$$_lambda_$$ [x] {(:add (:$_atIndex_$ (:$$_environment_$$) 'sampleCount') 1)})); (:$_endOfOuterBlock_$ () (:$$_withEnvironmentSampleCount_$$ 999 (:f 1)))}",
    ~v="1000",
    (),
  )
})
