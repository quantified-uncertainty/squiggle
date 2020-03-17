open Jest;
open Expect;

let makeTest = (~only=false, str, item1, item2) =>
  only
    ? Only.test(str, () =>
        expect(item1) |> toEqual(item2)
      )
    : test(str, () =>
        expect(item1) |> toEqual(item2)
      );

module FloatFloatMap = {
  module Id =
    Belt.Id.MakeComparable({
      type t = float;
      let cmp: (float, float) => int = Pervasives.compare;
    });

  type t = Belt.MutableMap.t(Id.t, float, Id.identity);

  let fromArray = (ar: array((float, float))) =>
    Belt.MutableMap.fromArray(ar, ~id=(module Id));
  let toArray = (t: t) => Belt.MutableMap.toArray(t);
  let empty = () => Belt.MutableMap.make(~id=(module Id));
  let increment = (el, t: t) =>
    Belt.MutableMap.update(
      t,
      el,
      fun
      | Some(n) => Some(n +. 1.0)
      | None => Some(1.0),
    );

  let get = (el, t: t) => Belt.MutableMap.get(t, el);
  let fmap = (fn, t: t) => Belt.MutableMap.map(t, fn);
};

let split = (sortedArray: array(float)) => {
  let continuous = [||];
  let discrete = FloatFloatMap.empty();
  Belt.Array.forEachWithIndex(
    sortedArray,
    (index, element) => {
      let maxIndex = (sortedArray |> Array.length) - 1;
      let possiblySimilarElements =
        (
          switch (index) {
          | 0 => [|index + 1|]
          | n when n == maxIndex => [|index - 1|]
          | _ => [|index - 1, index + 1|]
          }
        )
        |> Belt.Array.map(_, r => sortedArray[r]);
      let hasSimilarElement =
        Belt.Array.some(possiblySimilarElements, r => r == element);
      hasSimilarElement
        ? FloatFloatMap.increment(element, discrete)
        : {
          let _ = Js.Array.push(element, continuous);
          ();
        };
      ();
    },
  );

  (continuous, discrete);
};

describe("Lodash", () => {
  describe("Lodash", () => {
    makeTest("min", Lodash.min([|1, 3, 4|]), 1);
    makeTest("max", Lodash.max([|1, 3, 4|]), 4);
    makeTest("uniq", Lodash.uniq([|1, 3, 4, 4|]), [|1, 3, 4|]);
    makeTest(
      "countBy",
      Lodash.countBy([|1, 3, 4, 4|], r => r),
      Js.Dict.fromArray([|("1", 1), ("3", 1), ("4", 2)|]),
    );
    makeTest(
      "split",
      split([|1.432, 1.33455, 2.0|]),
      ([|1.432, 1.33455, 2.0|], FloatFloatMap.empty()),
    );
    makeTest(
      "split",
      split([|1.432, 1.33455, 2.0, 2.0, 2.0, 2.0|])
      |> (((c, disc)) => (c, disc |> FloatFloatMap.toArray)),
      ([|1.432, 1.33455|], [|(2.0, 4.0)|]),
    );

    let makeDuplicatedArray = count => {
      let arr = Belt.Array.range(1, count) |> E.A.fmap(float_of_int);
      let sorted = arr |> Belt.SortArray.stableSortBy(_, compare);
      E.A.concatMany([|sorted, sorted, sorted, sorted|])
      |> Belt.SortArray.stableSortBy(_, compare);
    };

    let (_, discrete) = split(makeDuplicatedArray(10));
    let toArr = discrete |> FloatFloatMap.toArray;
    makeTest("splitMedium", toArr |> Belt.Array.length, 10);

    let (c, discrete) = split(makeDuplicatedArray(500));
    let toArr = discrete |> FloatFloatMap.toArray;
    makeTest("splitMedium", toArr |> Belt.Array.length, 500);
  })
});