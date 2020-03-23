open Jest;
open Expect;

describe("Shape", () => {
  describe("Continuous", () => {
    test("", () => {
      Js.log(Jstat.Jstat.normal);
      expect(Jstat.Jstat.normal##pdf(3.0, 3.0, 3.0)) |> toEqual(1.0);
    })
  })
});