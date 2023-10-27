import { testEvalToBe } from "../helpers/reducerHelpers.js";

// TODO - it'd be useful to do most of `./sym_test.ts` tests here, without `Sym.` prefix
describe("Dist operations", () => {
  describe("Power on negative samples", () => {
    // ok when power is integer
    testEvalToBe("normal(-100, 1) ^ 2", "Sample Set Distribution");
    // fails when power is not an integer
    testEvalToBe(
      "normal(-100, 1) ^ 2.5",
      "Error(Distribution Math Error: Operation returned complex result)"
    );
  });

  testEvalToBe("sum([2,Dist.make(2),Dist.make(4)])", "PointMass(8)");
  testEvalToBe("sum([2,Dist.make(2),2 to 10])", "Sample Set Distribution");
  testEvalToBe(
    "product([Dist.make(2),Dist.make(5),Dist.make(3)])",
    "PointMass(30)"
  );
  testEvalToBe(
    "cumsum([Dist.make(1), Dist.make(5), Dist.make(3)])",
    "[PointMass(1),PointMass(6),PointMass(9)]"
  );
  testEvalToBe(
    "cumprod([Dist.make(1),Dist.make(5),Dist.make(3)])",
    "[PointMass(1),PointMass(5),PointMass(15)]"
  );
  testEvalToBe(
    "diff([Dist.make(1),Dist.make(5),Dist.make(3)])",
    "[PointMass(4),PointMass(-2)]"
  );
});
