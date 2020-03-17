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

describe("DistTypes", () => {
  describe("Domain", () => {
    let makeComplete = (yPoint, expectation) =>
      makeTest(
        "With input: " ++ Js.Float.toString(yPoint),
        DistTypes.Domain.yPointToSubYPoint(Complete, yPoint),
        expectation,
      );
    let makeSingle =
        (
          direction: [ | `left | `right],
          excludingProbabilityMass,
          yPoint,
          expectation,
        ) =>
      makeTest(
        "Excluding: "
        ++ Js.Float.toString(excludingProbabilityMass)
        ++ " and yPoint: "
        ++ Js.Float.toString(yPoint),
        DistTypes.Domain.yPointToSubYPoint(
          direction == `left
            ? LeftLimited({xPoint: 3.0, excludingProbabilityMass})
            : RightLimited({xPoint: 3.0, excludingProbabilityMass}),
          yPoint,
        ),
        expectation,
      );
    let makeDouble = (domain, yPoint, expectation) =>
      makeTest(
        "Excluding: limits",
        DistTypes.Domain.yPointToSubYPoint(domain, yPoint),
        expectation,
      );

    describe("With Complete Domain", () => {
      makeComplete(0.0, Some(0.0));
      makeComplete(0.6, Some(0.6));
      makeComplete(1.0, Some(1.0));
    });
    describe("With Left Limit", () => {
      makeSingle(`left, 0.5, 1.0, Some(1.0));
      makeSingle(`left, 0.5, 0.75, Some(0.5));
      makeSingle(`left, 0.8, 0.9, Some(0.5));
      makeSingle(`left, 0.5, 0.4, None);
      makeSingle(`left, 0.5, 0.5, Some(0.0));
    });
    describe("With Right Limit", () => {
      makeSingle(`right, 0.5, 1.0, None);
      makeSingle(`right, 0.5, 0.25, Some(0.5));
      makeSingle(`right, 0.8, 0.5, None);
      makeSingle(`right, 0.2, 0.2, Some(0.25));
      makeSingle(`right, 0.5, 0.5, Some(1.0));
      makeSingle(`right, 0.5, 0.0, Some(0.0));
      makeSingle(`right, 0.5, 0.5, Some(1.0));
    });
    describe("With Left and Right Limit", () => {
      makeDouble(
        LeftAndRightLimited(
          {excludingProbabilityMass: 0.25, xPoint: 3.0},
          {excludingProbabilityMass: 0.25, xPoint: 10.0},
        ),
        0.5,
        Some(0.5),
      );
      makeDouble(
        LeftAndRightLimited(
          {excludingProbabilityMass: 0.1, xPoint: 3.0},
          {excludingProbabilityMass: 0.1, xPoint: 10.0},
        ),
        0.2,
        Some(0.125),
      );
      makeDouble(
        LeftAndRightLimited(
          {excludingProbabilityMass: 0.1, xPoint: 3.0},
          {excludingProbabilityMass: 0.1, xPoint: 10.0},
        ),
        0.1,
        Some(0.0),
      );
      makeDouble(
        LeftAndRightLimited(
          {excludingProbabilityMass: 0.1, xPoint: 3.0},
          {excludingProbabilityMass: 0.1, xPoint: 10.0},
        ),
        0.05,
        None,
      );
    });
  })
});