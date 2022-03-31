open Jest
open Expect

let params: GenericDist_GenericOperation.params = {
  sampleCount: 100,
  xyPointLength: 100,
}

let normalDist: GenericDist_Types.genericDist = #Symbolic(#Normal({mean: 5.0, stdev: 2.0}))
let normalDist10: GenericDist_Types.genericDist = #Symbolic(#Normal({mean: 10.0, stdev: 2.0}))
let normalDist20: GenericDist_Types.genericDist = #Symbolic(#Normal({mean: 20.0, stdev: 2.0}))
let uniformDist: GenericDist_Types.genericDist = #Symbolic(#Uniform({low: 9.0, high: 10.0}))

let {toFloat, toDist, toString, toError} = module(GenericDist_GenericOperation.Output)
let {run, outputMap} = module(GenericDist_GenericOperation)
let run = run(params)
let outputMap = outputMap(params)
let toExt: option<'a> => 'a = E.O.toExt(
  "Should be impossible to reach (This error is in test file)",
)

describe("normalize", () => {
  test("has no impact on normal dist", () => {
    let result = run(#fromDist(#toDist(#normalize), normalDist))
    expect(result)->toEqual(Dist(normalDist))
  })
})

describe("mean", () => {
  test("for a normal distribution", () => {
    let result = GenericDist_GenericOperation.run(params, #fromDist(#toFloat(#Mean), normalDist))
    expect(result)->toEqual(Float(5.0))
  })
})

describe("mixture", () => {
  test("on two normal distributions", () => {
    let result =
      run(#mixture([(normalDist10, 0.5), (normalDist20, 0.5)]))
      ->outputMap(#fromDist(#toFloat(#Mean)))
      ->toFloat
      ->toExt
    expect(result)->toBeCloseTo(15.28)
  })
})

describe("toPointSet", () => {
  test("on symbolic normal distribution", () => {
    let result =
      run(#fromDist(#toDist(#toPointSet), normalDist))
      ->outputMap(#fromDist(#toFloat(#Mean)))
      ->toFloat
      ->toExt
    expect(result)->toBeCloseTo(5.09)
  })

  test("on sample set distribution with under 4 points", () => {
    let result =
      run(#fromDist(#toDist(#toPointSet), #SampleSet([0.0, 1.0, 2.0, 3.0])))->outputMap(
        #fromDist(#toFloat(#Mean)),
      )
    expect(result)->toEqual(GenDistError(Other("Converting sampleSet to pointSet failed")))
  })

  Skip.test("on sample set", () => {
    let result =
      run(#fromDist(#toDist(#toPointSet), normalDist))
      ->outputMap(#fromDist(#toDist(#toSampleSet(1000))))
      ->outputMap(#fromDist(#toDist(#toPointSet)))
      ->outputMap(#fromDist(#toFloat(#Mean)))
      ->toFloat
      ->toExt
    expect(result)->toBeCloseTo(5.09)
  })
})
