open Jest
open TestHelpers

describe("Continuous and discrete splits", () => {
  makeTest(
    "splits (1)",
    SampleSet.Internals.T.splitContinuousAndDiscrete([1.432, 1.33455, 2.0]),
    ([1.432, 1.33455, 2.0], E.FloatFloatMap.empty()),
  )
  makeTest(
    "splits (2)",
    SampleSet.Internals.T.splitContinuousAndDiscrete([
      1.432,
      1.33455,
      2.0,
      2.0,
      2.0,
      2.0,
    ]) |> (((c, disc)) => (c, disc |> E.FloatFloatMap.toArray)),
    ([1.432, 1.33455], [(2.0, 4.0)]),
  )

  let makeDuplicatedArray = count => {
    let arr = Belt.Array.range(1, count) |> E.A.fmap(float_of_int)
    let sorted = arr |> Belt.SortArray.stableSortBy(_, compare)
    E.A.concatMany([sorted, sorted, sorted, sorted]) |> Belt.SortArray.stableSortBy(_, compare)
  }

  let (_, discrete1) = SampleSet.Internals.T.splitContinuousAndDiscrete(
    makeDuplicatedArray(10),
  )
  let toArr1 = discrete1 |> E.FloatFloatMap.toArray
  makeTest("splitMedium at count=10", toArr1 |> Belt.Array.length, 10)

  let (_c, discrete2) = SampleSet.Internals.T.splitContinuousAndDiscrete(
    makeDuplicatedArray(500),
  )
  let toArr2 = discrete2 |> E.FloatFloatMap.toArray
  makeTest("splitMedium at count=500", toArr2 |> Belt.Array.length, 500)
})

