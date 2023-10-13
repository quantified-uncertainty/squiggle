import { testRun } from "../helpers/helpers.js";
import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("mixture", () => {
  testEvalToBe("mx(Sym.normal(5,2))", "Point Set Distribution");
  testEvalToBe(
    "mx(Sym.normal(5,2), Sym.normal(10,1), Sym.normal(15, 1))",
    "Point Set Distribution"
  );
  testEvalToBe(
    "mixture(Sym.normal(5,2), Sym.normal(10,1), [0.2, 0.4])",
    "Point Set Distribution"
  );

  describe("Outputs Sample Sets when necessary", () => {
    testEvalToBe(
      "mixture(normal(5,2), Sym.normal(10,1), [0.2, 0.4])",
      "Sample Set Distribution"
    );

    testEvalToBe(
      "mixture(Sym.normal(10, 1), normal(5,2), [0.2, 0.4])",
      "Sample Set Distribution"
    );

    testEvalToBe(
      "mixture(Sym.normal(10, 1), normal(5,2), [0.2, 0.4])",
      "Sample Set Distribution"
    );
  });

  test("Sample Set mode keeps correlations", async () => {
    expect(
      (
        await testRun(
          "a = Sym.normal(0,1); m = mx(a, 3, [.999999,.00001]); stdev(a - m)"
        )
      ).value
    ).toBeGreaterThan(1);
    expect(
      (
        await testRun(
          "a = normal(0,1); m = mx(a, 3, [.999999,.00001]); stdev(a - m)"
        )
      ).value
    ).toBeCloseTo(0);
  });
});
