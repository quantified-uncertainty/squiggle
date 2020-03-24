open Jest;
open Expect;

describe("Shape", () => {
  describe("Parser", () => {
    test("", () => {
      let parsed1 = MathJsParser.fromString("mm(normal(0,1), normal(10,1))");
      Js.log(parsed1 |> E.R.fmap(Jstat.toString));
      Js.log(parsed1 |> E.R.fmap(Jstat.toShape(20)));
      expect(1.0) |> toEqual(1.0);
    })
  })
});