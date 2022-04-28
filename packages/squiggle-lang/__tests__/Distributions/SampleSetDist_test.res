open Jest
open TestHelpers

let prepareInputs = (ar, minWeight) =>
  E.A.Sorted.Floats.splitContinuousAndDiscreteForMinWeight(ar, minWeight) |> (
    ((c, disc)) => (c, disc |> E.FloatFloatMap.toArray)
  )

describe("Continuous and discrete splits", () => {
  makeTest(
    "is empty, with no common elements",
    prepareInputs([1.432, 1.33455, 2.0], 2),
    ([1.33455, 1.432, 2.0], []),
  )

  makeTest(
    "only stores 3.5 as discrete when minWeight is 3",
    prepareInputs([1.432, 1.33455, 2.0, 2.0, 3.5, 3.5, 3.5], 3),
    ([1.33455, 1.432, 2.0, 2.0], [(3.5, 3.0)]),
  )

  makeTest(
    "doesn't store 3.5 as discrete when minWeight is 5",
    prepareInputs([1.432, 1.33455, 2.0, 2.0, 3.5, 3.5, 3.5], 5),
    ([1.33455, 1.432, 2.0, 2.0, 3.5, 3.5, 3.5], []),
  )

  let makeDuplicatedArray = count => {
    let arr = Belt.Array.range(1, count) |> E.A.fmap(float_of_int)
    let sorted = arr |> Belt.SortArray.stableSortBy(_, compare)
    E.A.concatMany([sorted, sorted, sorted, sorted]) |> Belt.SortArray.stableSortBy(_, compare)
  }

  let (_, discrete1) = E.A.Sorted.Floats.splitContinuousAndDiscreteForMinWeight(
    makeDuplicatedArray(10),
    2,
  )
  let toArr1 = discrete1 |> E.FloatFloatMap.toArray
  makeTest("splitMedium at count=10", toArr1 |> Belt.Array.length, 10)

  let (_c, discrete2) = E.A.Sorted.Floats.splitContinuousAndDiscreteForMinWeight(
    makeDuplicatedArray(500),
    2,
  )
  let toArr2 = discrete2 |> E.FloatFloatMap.toArray
  makeTest("splitMedium at count=500", toArr2 |> Belt.Array.length, 500)
  // makeTest("foo", [] |> Belt.Array.length, 500)
})
