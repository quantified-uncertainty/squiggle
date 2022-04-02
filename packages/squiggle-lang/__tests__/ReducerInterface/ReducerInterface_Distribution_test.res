open Jest
open Reducer_TestHelpers

let testEval = (str, result) => test(str, () => expectEvalToBe(str, result))

describe("eval", () => {
  Only.describe("expressions", () => {
    testEval("normal(5,2)", "Ok(Normal(5,2))")
    testEval("5 to 2", "Error(TODO: Low value must be less than high value.)")
    testEval("to(2,5)", "Ok(Lognormal(1.1512925464970227,0.278507821238345))")
    testEval("to(-2,2)", "Ok(Normal(0,1.215913388057542))")
    testEval("lognormal(5,2)", "Ok(Lognormal(5,2))")
    testEval("mean(normal(5,2))", "Ok(5)")
    testEval("mean(lognormal(1,2))", "Ok(20.085536923187668)")
    testEval("normalize(normal(5,2))", "Ok(Normal(5,2))")
    testEval("toPointSet(normal(5,2))", "Ok(Point Set Distribution)")
    testEval("toSampleSet(normal(5,2), 100)", "Ok(Sample Set Distribution)")
    testEval("add(normal(5,2), normal(10,2))", "Ok(Normal(15,2.8284271247461903))")
    testEval("add(normal(5,2), lognormal(10,2))", "Ok(Sample Set Distribution)")
    testEval("dotAdd(normal(5,2), lognormal(10,2))", "Ok(Point Set Distribution)")
    testEval("dotAdd(normal(5,2), 3)", "Ok(Point Set Distribution)")
    testEval("add(normal(5,2), 3)", "Ok(Point Set Distribution)")
    testEval("add(3, normal(5,2))", "Ok(Point Set Distribution)")
    testEval("3+normal(5,2)", "Ok(Point Set Distribution)")
    testEval("add(3, 3)", "Ok(6)")
    testEval("truncateLeft(normal(5,2), 3)", "Ok(Point Set Distribution)")
  })
})
