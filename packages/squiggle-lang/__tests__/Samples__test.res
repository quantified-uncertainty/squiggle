open Jest
open Expect

let makeTest = (~only=false, str, item1, item2) =>
  only
    ? Only.test(str, () => expect(item1) -> toEqual(item2))
    : test(str, () => expect(item1) -> toEqual(item2))

describe("Lodash", () =>
  describe("Lodash", () => {
    makeTest(
      "split",
      SampleSet.Internals.T.splitContinuousAndDiscrete([1.432, 1.33455, 2.0]),
      ([1.432, 1.33455, 2.0], E.FloatFloatMap.empty()),
    )
    makeTest(
      "split",
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

    let (_, discrete) = SampleSet.Internals.T.splitContinuousAndDiscrete(
      makeDuplicatedArray(10),
    )
    let toArr = discrete |> E.FloatFloatMap.toArray
    makeTest("splitMedium", toArr |> Belt.Array.length, 10)

    let (_c, discrete) = SampleSet.Internals.T.splitContinuousAndDiscrete(
      makeDuplicatedArray(500),
    )
    let toArr = discrete |> E.FloatFloatMap.toArray
    makeTest("splitMedium", toArr |> Belt.Array.length, 500)
  })
)
