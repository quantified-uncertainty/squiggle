open Jest
open Expect

let env: GenericDist_GenericOperation.env = {
  sampleCount: 100,
  xyPointLength: 100,
}

let normalDist: GenericDist_Types.genericDist = Symbolic(#Normal({mean: 5.0, stdev: 2.0}))
let normalDist10: GenericDist_Types.genericDist = Symbolic(#Normal({mean: 10.0, stdev: 2.0}))
let normalDist20: GenericDist_Types.genericDist = Symbolic(#Normal({mean: 20.0, stdev: 2.0}))
let uniformDist: GenericDist_Types.genericDist = Symbolic(#Uniform({low: 9.0, high: 10.0}))

let {toFloat, toDist, toString, toError} = module(GenericDist_GenericOperation.Output)
let {run} = module(GenericDist_GenericOperation)
let {fmap} = module(GenericDist_GenericOperation.Output)
let run = run(~env)
let outputMap = fmap(~env)
let toExt: option<'a> => 'a = E.O.toExt(
  "Should be impossible to reach (This error is in test file)",
)

describe("normalize", () => {
  test("has no impact on normal dist", () => {
    let result = run(FromDist(ToDist(Normalize), normalDist))
    expect(result)->toEqual(Dist(normalDist))
  })
})

describe("mean", () => {
  test("for a normal distribution", () => {
    let result = GenericDist_GenericOperation.run(~env, FromDist(ToFloat(#Mean), normalDist))
    expect(result)->toEqual(Float(5.0))
  })
})

describe("mixture", () => {
  test("on two normal distributions", () => {
    let result =
      run(Mixture([(normalDist10, 0.5), (normalDist20, 0.5)]))
      ->outputMap(FromDist(ToFloat(#Mean)))
      ->toFloat
      ->toExt
    expect(result)->toBeCloseTo(15.28)
  })
})

describe("toPointSet", () => {
  test("on symbolic normal distribution", () => {
    let result =
      run(FromDist(ToDist(ToPointSet), normalDist))
      ->outputMap(FromDist(ToFloat(#Mean)))
      ->toFloat
      ->toExt
    expect(result)->toBeCloseTo(5.09)
  })

  test("on sample set distribution with under 4 points", () => {
    let result =
      run(FromDist(ToDist(ToPointSet), SampleSet([0.0, 1.0, 2.0, 3.0])))->outputMap(
        FromDist(ToFloat(#Mean)),
      )
    expect(result)->toEqual(GenDistError(Other("Converting sampleSet to pointSet failed")))
  })

  Skip.test("on sample set", () => {
    let result =
      run(FromDist(ToDist(ToPointSet), normalDist))
      ->outputMap(FromDist(ToDist(ToSampleSet(1000))))
      ->outputMap(FromDist(ToDist(ToPointSet)))
      ->outputMap(FromDist(ToFloat(#Mean)))
      ->toFloat
      ->toExt
    expect(result)->toBeCloseTo(5.09)
  })
})
