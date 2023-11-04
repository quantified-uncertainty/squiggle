import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Dist", () => {
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
