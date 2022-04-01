open Jest
open Reducer_TestHelpers

let makeTest = (str, result) => test(str, () => expectEvalToBe(str, result))

describe("eval", () => {
  Only.describe("expressions", () => {
    makeTest("normal(5,2)", "Ok(Normal(5,2))")
    makeTest("lognormal(5,2)", "Ok(Lognormal(5,2))")
    makeTest("mean(normal(5,2))", "Ok(5)")
    makeTest("mean(lognormal(1,2))", "Ok(20.085536923187668)")
    makeTest("normalize(normal(5,2))", "Ok(Normal(5,2))")
    makeTest("toPointSet(normal(5,2))", "Ok(Point Set Distribution)")
    makeTest("toSampleSet(normal(5,2), 100)", "Ok(Sample Set Distribution)")
    makeTest("add(normal(5,2), normal(10,2))", "Ok(Normal(15,2.8284271247461903))")
    makeTest("add(normal(5,2), lognormal(10,2))", "Ok(Sample Set Distribution)")
    makeTest("dotAdd(normal(5,2), lognormal(10,2))", "Ok(Point Set Distribution)")
    makeTest("dotAdd(normal(5,2), 3)", "Ok(Point Set Distribution)")
    makeTest("add(normal(5,2), 3)", "Ok(Point Set Distribution)")
    makeTest("add(3, normal(5,2))", "Ok(Point Set Distribution)")
    makeTest("3+normal(5,2)", "Ok(Point Set Distribution)")
    makeTest("add(3, 3)", "Ok(6)")
    makeTest("truncateLeft(normal(5,2), 3)", "Ok(Point Set Distribution)")
    makeTest("mean(add(3, normal(5,2)))", "Ok(8.004619792609384)")
  })
})
