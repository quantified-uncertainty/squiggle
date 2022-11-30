open Jest
open Expect

let env: GenericDist.env = {
  sampleCount: 100,
  xyPointLength: 100,
}

let {
  normalDist5,
  normalDist10,
  normalDist20,
  normalDist,
  uniformDist,
  betaDist,
  lognormalDist,
  cauchyDist,
  triangularDist,
  exponentialDist,
} = module(GenericDist_Fixtures)

let {unpackResult} = module(TestHelpers)

describe("toPointSet", () => {
  test("on symbolic normal distribution", () => {
    let result =
      normalDist5
      ->GenericDist.toPointSet(~env, ())
      ->E.R.bind(pointSet => pointSet->PointSet->GenericDist.mean(~env))
      ->unpackResult

    expect(result)->toBeSoCloseTo(5.0, ~digits=0)
  })

  let pointSet =
    normalDist5
    ->GenericDist.toPointSet(~env, ())
    ->E.R.bind(pointSet => pointSet->PointSet->GenericDist.toSampleSetDist(1000))
    ->E.R.bind(sampleSet => sampleSet->SampleSet->GenericDist.toPointSet(~env, ()))
    ->unpackResult

  test("mean from sample set", () => {
    let mean = PointSet(pointSet)->GenericDist.mean(~env)->unpackResult

    expect(mean)->toBeSoCloseTo(5.0, ~digits=-1)
  })

  test("isNormalized from sample set", () => {
    let isNormalized = pointSet->PointSet->GenericDist.isNormalized
    expect(isNormalized)->toBe(true)
  })
})

describe("sparkline", () => {
  let runTest = (
    name: string,
    dist: DistributionTypes.genericDist,
    expected: result<string, GenericDist.error>,
  ) => {
    test(name, () => {
      let result = dist->GenericDist.toSparkline(~sampleCount=env.sampleCount, ~bucketCount=20, ())
      expect(result)->toEqual(expected)
    })
  }

  runTest("normal", normalDist, Ok(`▁▁▁▁▁▂▄▆▇██▇▆▄▂▁▁▁▁▁`))

  runTest(
    "uniform",
    uniformDist,
    Ok(`████████████████████`),
  )

  runTest("beta", betaDist, Ok(`▁▄▇████▇▆▅▄▃▃▂▁▁▁▁▁▁`))

  runTest(
    "lognormal",
    lognormalDist,
    Ok(`▁█▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁`),
  )

  runTest("cauchy", cauchyDist, Ok(`▁▁▁▁▁▁▁▁▁██▁▁▁▁▁▁▁▁▁`))

  runTest(
    "triangular",
    triangularDist,
    Ok(`▁▁▂▃▄▅▆▇████▇▆▅▄▃▂▁▁`),
  )

  runTest(
    "exponential",
    exponentialDist,
    Ok(`█▅▄▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁`),
  )
})
