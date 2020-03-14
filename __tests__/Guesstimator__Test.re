open Jest;
open Expect;

let makeTest = (~only=false, str, item1, item2) =>
  only
    ? Only.test(str, () =>
        expect(item1) |> toEqual(item2)
      )
    : test(str, () =>
        expect(item1) |> toEqual(item2)
      ) /* })*/;

// These fail because of issues with Jest, Babel, and Bucklescript
// describe("XYShapes", () => {
//   describe("logScorePoint", () => {
//     makeTest(
//       "When identical",
//       Some(Guesstimator.stringToMixedShape(~string="5 to 20")),
//       None,
//     )
//   })