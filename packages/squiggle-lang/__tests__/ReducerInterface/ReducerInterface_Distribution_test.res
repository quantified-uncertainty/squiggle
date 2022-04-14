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

describe("eval on distribution functions", () => {
  describe("normal distribution", () => {
    testEval("normal(5,2)", "Ok(Normal(5,2))")
  })
  describe("lognormal distribution", () => {
    testEval("lognormal(5,2)", "Ok(Lognormal(5,2))")
  })
  describe("unaryMinus", () => {
    testEval("mean(-normal(5,2))", "Ok(-5.002887370380851)")
  })
  describe("to", () => {
    testEval("5 to 2", "Error(TODO: Low value must be less than high value.)")
    testEval("to(2,5)", "Ok(Lognormal(1.1512925464970227,0.27853260523016377))")
    testEval("to(-2,2)", "Ok(Normal(0,1.2159136638235384))")
  })
  describe("mean", () => {
    testEval("mean(normal(5,2))", "Ok(5)")
    testEval("mean(lognormal(1,2))", "Ok(20.085536923187668)")
  })
  describe("toString", () => {
    testEval("toString(normal(5,2))", "Ok('Normal(5,2)')")
  })
  describe("normalize", () => {
    testEval("normalize(normal(5,2))", "Ok(Normal(5,2))")
  })
  describe("toPointSet", () => {
    testEval("toPointSet(normal(5,2))", "Ok(Point Set Distribution)")
  })
  describe("toSampleSet", () => {
    testEval("toSampleSet(normal(5,2), 100)", "Ok(Sample Set Distribution)")
  })
  describe("add", () => {
    testEval("add(normal(5,2), normal(10,2))", "Ok(Normal(15,2.8284271247461903))")
    testEval("add(normal(5,2), lognormal(10,2))", "Ok(Sample Set Distribution)")
    testEval("add(normal(5,2), 3)", "Ok(Point Set Distribution)")
    testEval("add(3, normal(5,2))", "Ok(Point Set Distribution)")
    testEval("3+normal(5,2)", "Ok(Point Set Distribution)")
    testEval("normal(5,2)+3", "Ok(Point Set Distribution)")
  })
  describe("truncate", () => {
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
    testEval("mx(normal(5,2), normal(10,1), normal(15, 1))", "Ok(Point Set Distribution)")
    testEval("mixture(normal(5,2), normal(10,1), [0.2, 0.4])", "Ok(Point Set Distribution)")
  })
})

describe("parse on distribution functions", () => {
  describe("power", () => {
    testParse("normal(5,2) ^ normal(5,1)", "Ok((:pow (:normal 5 2) (:normal 5 1)))")
    testParse("3 ^ normal(5,1)", "Ok((:pow 3 (:normal 5 1)))")
    testParse("normal(5,2) ^ 3", "Ok((:pow (:normal 5 2) 3))")
  })
  describe("pointwise arithmetic expressions", () => {
    testParse(~skip=true, "normal(5,2) .+ normal(5,1)", "Ok((:dotAdd (:normal 5 2) (:normal 5 1)))")
    testParse(
      ~skip=true,
      "normal(5,2) .- normal(5,1)",
      "Ok((:dotSubtract (:normal 5 2) (:normal 5 1)))",
    )
    testParse("normal(5,2) .* normal(5,1)", "Ok((:dotMultiply (:normal 5 2) (:normal 5 1)))")
    testParse("normal(5,2) ./ normal(5,1)", "Ok((:dotDivide (:normal 5 2) (:normal 5 1)))")
    testParse("normal(5,2) .^ normal(5,1)", "Ok((:dotPow (:normal 5 2) (:normal 5 1)))")
  })
  describe("equality", () => {
    testParse("5 == normal(5,2)", "Ok((:equal 5 (:normal 5 2)))")
  })
  describe("pointwise adding two normals", () => {
    testParse(~skip=true, "normal(5,2) .+ normal(5,1)", "Ok((:dotAdd (:normal 5 2) (:normal 5 1)))")
  })
  describe("exponential of one distribution", () => {
    testParse(~skip=true, "exp(normal(5,2)", "Ok((:pow (:normal 5 2) 3))")
  })
})
