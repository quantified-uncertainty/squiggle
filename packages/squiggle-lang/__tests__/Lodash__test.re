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

describe("Lodash", () => {
  describe("Lodash", () => {
    makeTest(~only=true, "Foo", Jstat.Normal.mean(5.0,2.0), 5.0);
    makeTest("min", Lodash.min([|1, 3, 4|]), 1);
    makeTest("max", Lodash.max([|1, 3, 4|]), 4);
    makeTest("uniq", Lodash.uniq([|1, 3, 4, 4|]), [|1, 3, 4|]);
    makeTest(
      "countBy",
      Lodash.countBy([|1, 3, 4, 4|], r => r),
      Js.Dict.fromArray([|("1", 1), ("3", 1), ("4", 2)|]),
    );
  })
});