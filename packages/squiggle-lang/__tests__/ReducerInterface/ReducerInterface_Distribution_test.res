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
    testEval("mean(-normal(5,2))", "Ok(-5)")
    testEval("-normal(5,2)", "Ok(Normal(-5,2))")
  })
  describe("to", () => {
    testEval("5 to 2", "Error(TODO: Low value must be less than high value.)")
    testEval("to(2,5)", "Ok(Lognormal(1.1512925464970227,0.27853260523016377))")
    testEval("to(-2,2)", "Ok(Normal(0,1.2159136638235384))")
  })
  describe("mean", () => {
    testEval("mean(normal(5,2))", "Ok(5)")
    testEval("mean(lognormal(1,2))", "Ok(20.085536923187668)")
    testEval("mean(gamma(5,5))", "Ok(25)")
    testEval("mean(bernoulli(0.2))", "Ok(0.2)")
    testEval("mean(bernoulli(0.8))", "Ok(0.8)")
    testEval("mean(logistic(5,1))", "Ok(5)")
  })
  describe("toString", () => {
    testEval("toString(normal(5,2))", "Ok('Normal(5,2)')")
  })
  describe("normalize", () => {
    testEval("normalize(normal(5,2))", "Ok(Normal(5,2))")
  })
  describe("add", () => {
    testEval("add(normal(5,2), normal(10,2))", "Ok(Normal(15,2.8284271247461903))")
    testEval("add(normal(5,2), lognormal(10,2))", "Ok(Sample Set Distribution)")
    testEval("add(normal(5,2), 3)", "Ok(Normal(8,2))")
    testEval("add(3, normal(5,2))", "Ok(Normal(8,2))")
    testEval("3+normal(5,2)", "Ok(Normal(8,2))")
    testEval("normal(5,2)+3", "Ok(Normal(8,2))")
  })
  describe("subtract", () => {
    testEval("10 - normal(5, 1)", "Ok(Normal(5,1))")
    testEval("normal(5, 1) - 10", "Ok(Normal(-5,1))")
    testEval("mean(1 - toPointSet(normal(5, 2)))", "Ok(-4.002309896304692)")
  })
  describe("multiply", () => {
    testEval("normal(10, 2) * 2", "Ok(Normal(20,4))")
    testEval("2 * normal(10, 2)", "Ok(Normal(20,4))")
    testEval("lognormal(5,2) * lognormal(10,2)", "Ok(Lognormal(15,2.8284271247461903))")
    testEval("lognormal(10, 2) * lognormal(5, 2)", "Ok(Lognormal(15,2.8284271247461903))")
    testEval("2 * lognormal(5, 2)", "Ok(Lognormal(5.693147180559945,2))")
    testEval("lognormal(5, 2) * 2", "Ok(Lognormal(5.693147180559945,2))")
  })
  describe("division", () => {
    testEval("lognormal(5,2) / lognormal(10,2)", "Ok(Lognormal(-5,2.8284271247461903))")
    testEval("lognormal(10,2) / lognormal(5,2)", "Ok(Lognormal(5,2.8284271247461903))")
    testEval("lognormal(5, 2) / 2", "Ok(Lognormal(4.306852819440055,2))")
    testEval("2 / lognormal(5, 2)", "Ok(Lognormal(-4.306852819440055,2))")
    testEval("2 / normal(10, 2)", "Ok(Sample Set Distribution)")
    testEval("normal(10, 2) / 2", "Ok(Normal(5,1))")
  })
  describe("truncate", () => {
    testEval("truncateLeft(normal(5,2), 3)", "Ok(Point Set Distribution)")
    testEval("truncateRight(normal(5,2), 3)", "Ok(Point Set Distribution)")
    testEval("truncate(normal(5,2), 3, 8)", "Ok(Point Set Distribution)")
    testEval("truncate(normal(5,2) |> SampleSet.fromDist, 3, 8)", "Ok(Sample Set Distribution)")
    testEval("isNormalized(truncate(normal(5,2), 3, 8))", "Ok(true)")
  })

  describe("exp", () => {
    testEval("exp(normal(5,2))", "Ok(Sample Set Distribution)")
  })

  describe("pow", () => {
    testEval("pow(3, uniform(5,8))", "Ok(Sample Set Distribution)")
    testEval("pow(uniform(5,8), 3)", "Ok(Sample Set Distribution)")
    testEval("pow(uniform(5,8), uniform(9, 10))", "Ok(Sample Set Distribution)")
  })

  describe("log", () => {
    testEval("log(2, uniform(5,8))", "Ok(Sample Set Distribution)")
    testEval(
      "log(normal(5,2), 3)",
      "Error(Distribution Math Error: Logarithm of input error: First input must be completely greater than 0)",
    )
    testEval(
      "log(normal(5,2), normal(10,1))",
      "Error(Distribution Math Error: Logarithm of input error: First input must be completely greater than 0)",
    )
    testEval("log(uniform(5,8))", "Ok(Sample Set Distribution)")
    testEval("log10(uniform(5,8))", "Ok(Sample Set Distribution)")
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
    testParse(
      "normal(5,2) ^ normal(5,1)",
      "Ok({(:$_endOfOuterBlock_$ () (:pow (:normal 5 2) (:normal 5 1)))})",
    )
    testParse("3 ^ normal(5,1)", "Ok({(:$_endOfOuterBlock_$ () (:pow 3 (:normal 5 1)))})")
    testParse("normal(5,2) ^ 3", "Ok({(:$_endOfOuterBlock_$ () (:pow (:normal 5 2) 3))})")
  })
  describe("subtraction", () => {
    testParse("10 - normal(5,1)", "Ok({(:$_endOfOuterBlock_$ () (:subtract 10 (:normal 5 1)))})")
    testParse("normal(5,1) - 10", "Ok({(:$_endOfOuterBlock_$ () (:subtract (:normal 5 1) 10))})")
  })
  describe("pointwise arithmetic expressions", () => {
    testParse(~skip=true, "normal(5,2) .+ normal(5,1)", "Ok((:dotAdd (:normal 5 2) (:normal 5 1)))")
    testParse(
      ~skip=true,
      "normal(5,2) .- normal(5,1)",
      "Ok((:$_endOfOuterBlock_$ () (:$$_block_$$ (:dotSubtract (:normal 5 2) (:normal 5 1)))))",
      // TODO: !!! returns "Ok({(:dotPow (:normal 5 2) (:normal 5 1))})"
    )
    testParse(
      "normal(5,2) .* normal(5,1)",
      "Ok({(:$_endOfOuterBlock_$ () (:dotMultiply (:normal 5 2) (:normal 5 1)))})",
    )
    testParse(
      "normal(5,2) ./ normal(5,1)",
      "Ok({(:$_endOfOuterBlock_$ () (:dotDivide (:normal 5 2) (:normal 5 1)))})",
    )
    testParse(
      "normal(5,2) .^ normal(5,1)",
      "Ok({(:$_endOfOuterBlock_$ () (:dotPow (:normal 5 2) (:normal 5 1)))})",
    )
  })
  describe("equality", () => {
    testParse("5 == normal(5,2)", "Ok({(:$_endOfOuterBlock_$ () (:equal 5 (:normal 5 2)))})")
  })
  describe("pointwise adding two normals", () => {
    testParse(~skip=true, "normal(5,2) .+ normal(5,1)", "Ok((:dotAdd (:normal 5 2) (:normal 5 1)))")
  })
  describe("exponential of one distribution", () => {
    testParse(~skip=true, "exp(normal(5,2)", "Ok((:pow (:normal 5 2) 3))")
  })
})
