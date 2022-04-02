open Jest

let testSkip: (bool, string, unit => assertion) => unit = (skip: bool) =>
  if skip {
    Skip.test
  } else {
    test
  }
let testEval = (~skip=false, str, result) =>
  testSkip(skip)(str, () => Reducer_TestHelpers.expectEvalToBe(str, result))
let testParse = (~skip=false, str, result) =>
  testSkip(skip)(str, () => Reducer_TestHelpers.expectParseToBe(str, result))

describe("eval", () => {
  describe("expressions", () => {
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
    testEval("add(normal(5,2), 3)", "Ok(Point Set Distribution)")
    testEval("add(3, normal(5,2))", "Ok(Point Set Distribution)")
    testEval("3+normal(5,2)", "Ok(Point Set Distribution)")
    testEval("normal(5,2)+3", "Ok(Point Set Distribution)")
    testEval("add(3, 3)", "Ok(6)")
    testEval("truncateLeft(normal(5,2), 3)", "Ok(Point Set Distribution)")
    testEval("truncateRight(normal(5,2), 3)", "Ok(Point Set Distribution)")
    testEval("truncate(normal(5,2), 3, 8)", "Ok(Point Set Distribution)")
  })

  describe("exp", () => {
    testEval("exp(normal(5,2))", "Ok(Point Set Distribution)")
  })

  describe("pow", () => {
    testEval("pow(3, uniform(5,8))", "Ok(Point Set Distribution)")
    testEval("pow(uniform(5,8), 3)", "Ok(Point Set Distribution)")
    testEval("pow(uniform(5,8), uniform(9, 10))", "Ok(Sample Set Distribution)")
  })

  describe("log", () => {
    testEval("log(2, uniform(5,8))", "Ok(Point Set Distribution)")
    testEval("log(normal(5,2), 3)", "Ok(Point Set Distribution)")
    testEval("log(normal(5,2), normal(10,1))", "Ok(Sample Set Distribution)")
    testEval("log(uniform(5,8))", "Ok(Point Set Distribution)")
    testEval("log10(uniform(5,8))", "Ok(Point Set Distribution)")
  })

  describe("dotLog", () => {
    testEval("dotLog(normal(5,2), 3)", "Ok(Point Set Distribution)")
    testEval("dotLog(normal(5,2), 3)", "Ok(Point Set Distribution)")
    testEval("dotLog(normal(5,2), normal(10,1))", "Ok(Point Set Distribution)")
  })

  describe("dotAdd", () => {
    testEval("dotAdd(normal(5,2), lognormal(10,2))", "Ok(Point Set Distribution)")
    testEval("dotAdd(normal(5,2), 3)", "Ok(Point Set Distribution)")
  })

  describe("equality", () => {
    testEval(~skip=true, "normal(5,2) == normal(5,2)", "Ok(true)")
  })

  describe("mixture", () => {
    testEval(
      ~skip=true,
      "mx(normal(5,2), normal(10,1), normal(15, 1))",
      "Ok(Point Set Distribution)",
    )
    testEval(
      ~skip=true,
      "mixture(normal(5,2), normal(10,1), [.2,, .4])",
      "Ok(Point Set Distribution)",
    )
  })
})

describe("MathJs parse", () => {
  describe("literals operators paranthesis", () => {
    testParse("mean(normal(5,2) + normal(5,1))", "Ok((:mean (:add (:normal 5 2) (:normal 5 1))))")
    testParse("normal(5,2) .* normal(5,1)", "Ok((:dotMultiply (:normal 5 2) (:normal 5 1)))")
    testParse("normal(5,2) ./ normal(5,1)", "Ok((:dotDivide (:normal 5 2) (:normal 5 1)))")
    testParse("normal(5,2) .^ normal(5,1)", "Ok((:dotPow (:normal 5 2) (:normal 5 1)))")
    testParse("normal(5,2) ^ normal(5,1)", "Ok((:pow (:normal 5 2) (:normal 5 1)))")
    testParse("3 ^ normal(5,1)", "Ok((:pow 3 (:normal 5 1)))")
    testParse("normal(5,2) ^ 3", "Ok((:pow (:normal 5 2) 3))")
    testParse("5 == normal(5,2)", "Ok((:equal 5 (:normal 5 2)))")
    describe("adding two normals", () => {
      testParse(
        ~skip=true,
        "normal(5,2) .+ normal(5,1)",
        "Ok((:dotAdd (:normal 5 2) (:normal 5 1)))",
      )
    })
    describe("exponential of one distribution", () => {
      testParse(~skip=true, "exp(normal(5,2)", "Ok((:pow (:normal 5 2) 3))")
    })
  })
})
