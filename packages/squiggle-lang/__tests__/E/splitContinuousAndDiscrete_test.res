open Jest
open TestHelpers
//open FastCheck
//open Arbitrary
//open Property.Sync

let prepareInputs = (ar, minWeight) =>
  E.A.Floats.Sorted.splitContinuousAndDiscreteForMinWeight(ar, ~minDiscreteWeight=minWeight)->(
    ((c, disc)) => (c, disc->E.FloatFloatMap.toArray)
  )

describe("Continuous and discrete splits", () => {
  makeTest(
    "is empty, with no common elements",
    prepareInputs([1.33455, 1.432, 2.0], 2),
    ([1.33455, 1.432, 2.0], []),
  )

  makeTest(
    "only stores 3.5 as discrete when minWeight is 3",
    prepareInputs([1.33455, 1.432, 2.0, 2.0, 3.5, 3.5, 3.5], 3),
    ([1.33455, 1.432, 2.0, 2.0], [(3.5, 3.0)]),
  )

  makeTest(
    "doesn't store 3.5 as discrete when minWeight is 5",
    prepareInputs([1.33455, 1.432, 2.0, 2.0, 3.5, 3.5, 3.5], 5),
    ([1.33455, 1.432, 2.0, 2.0, 3.5, 3.5, 3.5], []),
  )

  makeTest(
    "more general test",
    prepareInputs([10., 10., 11., 11., 11., 12., 13., 13., 13., 13., 13., 14.], 3),
    ([10., 10., 12., 14.], [(11., 3.), (13., 5.)]),
  )

  let makeDuplicatedArray = count => {
    let arr = Belt.Array.range(1, count)->E.A.fmap(float_of_int)
    let sorted = arr->Belt.SortArray.stableSortBy(compare)
    E.A.concatMany([sorted, sorted, sorted, sorted])->Belt.SortArray.stableSortBy(compare)
  }

  let (_, discrete1) = E.A.Floats.Sorted.splitContinuousAndDiscreteForMinWeight(
    makeDuplicatedArray(10),
    ~minDiscreteWeight=2,
  )
  let toArr1 = discrete1->E.FloatFloatMap.toArray
  makeTest("splitMedium at count=10", toArr1->E.A.length, 10)

  let (_c, discrete2) = E.A.Floats.Sorted.splitContinuousAndDiscreteForMinWeight(
    makeDuplicatedArray(500),
    ~minDiscreteWeight=2,
  )
  let toArr2 = discrete2->E.FloatFloatMap.toArray
  makeTest("splitMedium at count=500", toArr2->E.A.length, 500)
  // makeTest("foo", [] -> E.A.length, 500)

  let testDup = (counts, weight) => {
    let random = _ => 0.01 +. Js.Math.random() // random() can produce 0
    let values = counts->E.A.length->E.A.makeBy(random)->E.A.Floats.cumSum
    let segments = Belt.Array.zipBy(counts, values, Belt.Array.make)
    let (cont, disc) = E.A.Floats.Sorted.splitContinuousAndDiscreteForMinWeight(
      segments->E.A.concatMany,
      ~minDiscreteWeight=weight,
    )
    let (contSegments, discSegments) = segments->Belt.Array.partition(s => E.A.length(s) < weight)
    let discExpect =
      discSegments
      ->E.A.fmap(a => (E.A.unsafe_get(a, 0), E.A.length(a)->Belt.Int.toFloat))
      ->E.FloatFloatMap.fromArray
    makeTest("continuous portion", cont, contSegments->E.A.concatMany)
    makeTest("discrete portion", disc, discExpect)
    true
  }
  testDup([3, 5, 1, 1], 4)->ignore

//assert_(
//  property2(
//    Combinators.arrayWithLength(integerRange(1, 30), 0, 50),
//    integerRange(2, 20),
//    testDup,
//  ),
//)
})
