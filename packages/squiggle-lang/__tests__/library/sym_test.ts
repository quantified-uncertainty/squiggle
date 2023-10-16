import * as fc from "fast-check";
import { testRun } from "../helpers/helpers.js";
import { MySkip, testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Symbolic constructors", () => {
  describe("normal constructor", () => {
    testEvalToBe("Sym.normal(5,2)", "Normal(5,2)");

    testEvalToBe("Sym.normal({mean:5,stdev:2})", "Normal(5,2)");

    testEvalToBe(
      "Sym.normal({p5: -2, p95: 4})",
      "Normal(1,1.8238704957353071)"
    );
    testEvalToBe(
      "Sym.normal({p5: 4, p95: -2})",
      "Error(Distribution Math Error: Low value must be less than high value)"
    );

    test("5% inv", async () => {
      expect(
        (await testRun("Sym.normal({p5: -2, p95: 4}) -> inv(0.05)")).value
      ).toBeCloseTo(-2);
      expect(
        (await testRun("Sym.normal({p5: -2, p95: 4}) -> inv(0.95)")).value
      ).toBeCloseTo(4);
    });

    testEvalToBe(
      "Sym.normal({p10: -2, p90: 4})",
      "Normal(1,2.3409124382171367)"
    );
    test("10% inv", async () => {
      expect(
        (await testRun("Sym.normal({p10: -2, p90: 4}) -> inv(0.1)")).value
      ).toBeCloseTo(-2);
      expect(
        (await testRun("Sym.normal({p10: -2, p90: 4}) -> inv(0.9)")).value
      ).toBeCloseTo(4);
    });

    testEvalToBe(
      "Sym.normal({p25: -2, p75: 4})",
      "Normal(1,4.447806655516805)"
    );
    test("25% inv", async () => {
      expect(
        (await testRun("Sym.normal({p25: -2, p75: 4}) -> inv(0.25)")).value
      ).toBeCloseTo(-2);
      expect(
        (await testRun("Sym.normal({p25: -2, p75: 4}) -> inv(0.75)")).value
      ).toBeCloseTo(4);
    });
  });

  describe("lognormal constructor", () => {
    testEvalToBe("Sym.lognormal(5,2)", "Lognormal(5,2)");

    testEvalToBe(
      "Sym.lognormal({p5: 2, p95: 5})",
      "Lognormal(1.1512925464970227,0.27853260523016377)"
    );
    test("5% inv", async () => {
      expect(
        (await testRun("Sym.lognormal({p5: 2, p95: 5}) -> inv(0.05)")).value
      ).toBeCloseTo(2);
      expect(
        (await testRun("Sym.lognormal({p5: 2, p95: 5}) -> inv(0.95)")).value
      ).toBeCloseTo(5);
    });

    testEvalToBe(
      "Sym.lognormal({p10: 2, p90: 5})",
      "Lognormal(1.1512925464970227,0.3574927285445488)"
    );
    test("10% inv", async () => {
      expect(
        (await testRun("Sym.lognormal({p10: 2, p90: 5}) -> inv(0.1)")).value
      ).toBeCloseTo(2);
      expect(
        (await testRun("Sym.lognormal({p10: 2, p90: 5}) -> inv(0.9)")).value
      ).toBeCloseTo(5);
    });

    testEvalToBe(
      "Sym.lognormal({p25: 2, p75: 5})",
      "Lognormal(1.1512925464970227,0.6792473359363719)"
    );
    test("25% inv", async () => {
      expect(
        (await testRun("Sym.lognormal({p25: 2, p75: 5}) -> inv(0.25)")).value
      ).toBeCloseTo(2);
      expect(
        (await testRun("Sym.lognormal({p25: 2, p75: 5}) -> inv(0.75)")).value
      ).toBeCloseTo(5);
    });
  });

  testEvalToBe("Sym.pointMass(5)", "PointMass(5)");
  testEvalToBe("pointMass(5)", "PointMass(5)");
});

describe("distribution functions", () => {
  describe("unaryMinus", () => {
    testEvalToBe("mean(-Sym.normal(5,2))", "-5");
    testEvalToBe("-Sym.normal(5,2)", "Normal(-5,2)");
  });
  describe("mean", () => {
    testEvalToBe("mean(Sym.normal(5,2))", "5");
    testEvalToBe("mean(Sym.lognormal(1,2))", "20.085536923187668");
    testEvalToBe("mean(Sym.gamma(5,5))", "25");
    testEvalToBe("mean(Sym.bernoulli(0.2))", "0.2");
    testEvalToBe("mean(Sym.bernoulli(0.8))", "0.8");
    testEvalToBe("mean(Sym.logistic(5,1))", "5");
  });
  describe("stdev", () => {
    testEvalToBe("stdev(Sym.normal(5,2))", "2");
    testEvalToBe("stdev(Sym.lognormal(1,2))", "147.04773715128695");
    testEvalToBe("stdev(Sym.gamma(5,5))", "11.180339887498949");
    testEvalToBe("stdev(Sym.bernoulli(0.2))", "0.4");
    testEvalToBe("stdev(Sym.bernoulli(0.8))", "0.39999999999999997");
    testEvalToBe("stdev(Sym.logistic(5,1))", "1.8137993642342178");
  });
  describe("normalize", () => {
    testEvalToBe("normalize(Sym.normal(5,2))", "Normal(5,2)");
  });
  describe("add", () => {
    testEvalToBe(
      "add(Sym.normal(5,2), Sym.normal(10,2))",
      "Normal(15,2.8284271247461903)"
    );
    testEvalToBe(
      "add(Sym.normal(5,2), Sym.lognormal(10,2))",
      "Sample Set Distribution"
    );
    testEvalToBe("add(Sym.normal(5,2), 3)", "Normal(8,2)");
    testEvalToBe("add(3, Sym.normal(5,2))", "Normal(8,2)");
    testEvalToBe("3+Sym.normal(5,2)", "Normal(8,2)");
    testEvalToBe("Sym.normal(5,2)+3", "Normal(8,2)");
  });
  describe("subtract", () => {
    testEvalToBe("10 - Sym.normal(5, 1)", "Normal(5,1)");
    testEvalToBe("Sym.normal(5, 1) - 10", "Normal(-5,1)");
    test("mean(1 - toPointSet(Sym.normal(5, 2)))", async () => {
      const result = await testRun("mean(1 - toPointSet(Sym.normal(5, 2)))");
      if (result.tag !== "Number") {
        throw new Error();
      }
      expect(Math.abs(result.value - -4)).toBeLessThan(0.3); // FIXME - unstable
    });
  });
  describe("multiply", () => {
    testEvalToBe("Sym.normal(10, 2) * 2", "Normal(20,4)");
    testEvalToBe("Sym.normal(10, 2) * 0", "PointMass(0)");
    testEvalToBe("0 * Sym.normal(10, 2)", "PointMass(0)");
    testEvalToBe("2 * Sym.normal(10, 2)", "Normal(20,4)");
    testEvalToBe(
      "Sym.lognormal(5,2) * Sym.lognormal(10,2)",
      "Lognormal(15,2.8284271247461903)"
    );
    testEvalToBe(
      "Sym.lognormal(10, 2) * Sym.lognormal(5, 2)",
      "Lognormal(15,2.8284271247461903)"
    );
    testEvalToBe("2 * Sym.lognormal(5, 2)", "Lognormal(5.693147180559945,2)");
    testEvalToBe("Sym.lognormal(5, 2) * 2", "Lognormal(5.693147180559945,2)");
  });
  describe("division", () => {
    testEvalToBe(
      "Sym.lognormal(5,2) / Sym.lognormal(10,2)",
      "Lognormal(-5,2.8284271247461903)"
    );
    testEvalToBe(
      "Sym.lognormal(10,2) / Sym.lognormal(5,2)",
      "Lognormal(5,2.8284271247461903)"
    );
    testEvalToBe("Sym.lognormal(5, 2) / 2", "Lognormal(4.306852819440055,2)");
    testEvalToBe("2 / Sym.lognormal(5, 2)", "Lognormal(-4.306852819440055,2)");
    testEvalToBe("2 / Sym.normal(10, 2)", "Sample Set Distribution");
    testEvalToBe("Sym.normal(10, 2) / 2", "Normal(5,1)");
  });
  describe("truncate", () => {
    testEvalToBe("truncateLeft(Sym.normal(5,2), 3)", "Point Set Distribution");
    testEvalToBe("truncateRight(Sym.normal(5,2), 3)", "Point Set Distribution");
    testEvalToBe("truncate(Sym.normal(5,2), 3, 8)", "Point Set Distribution");
    testEvalToBe(
      "truncate(Sym.normal(5,2) -> SampleSet.fromDist, 3, 8)",
      "Sample Set Distribution"
    );
    testEvalToBe("isNormalized(truncate(Sym.normal(5,2), 3, 8))", "true");
  });

  describe("exp", () => {
    testEvalToBe("exp(Sym.normal(5,2))", "Sample Set Distribution");
  });

  describe("pow", () => {
    testEvalToBe("pow(3, Sym.uniform(5,8))", "Sample Set Distribution");
    testEvalToBe("pow(Sym.uniform(5,8), 3)", "Sample Set Distribution");
    testEvalToBe(
      "pow(Sym.uniform(5,8), Sym.uniform(9, 10))",
      "Sample Set Distribution"
    );
  });

  describe("log", () => {
    testEvalToBe("log(2, Sym.uniform(5,8))", "Sample Set Distribution");
    testEvalToBe(
      "log(Sym.normal(0,2), 3)",
      "Error(Distribution Math Error: Logarithm of input error: First input must be completely greater than 0)"
    );
    testEvalToBe(
      "log(normal(0,2), Sym.normal(10,1))",
      "Error(Distribution Math Error: Logarithm of input error: First input must be completely greater than 0)"
    );
    testEvalToBe("log(2, 0.0001 to 5)", "Sample Set Distribution"); // log with low values, see https://github.com/quantified-uncertainty/squiggle/issues/1098
    testEvalToBe("log(Sym.uniform(5,8))", "Sample Set Distribution");
    testEvalToBe("log10(Sym.uniform(5,8))", "Sample Set Distribution");
  });

  describe("dotAdd", () => {
    testEvalToBe(
      "dotAdd(Sym.normal(5,2), Sym.lognormal(10,2))",
      "Point Set Distribution"
    );
    testEvalToBe("dotAdd(Sym.normal(5,2), 3)", "Point Set Distribution");
  });

  describe("equality", () => {
    MySkip.testEvalToBe("Sym.normal(5,2) == Sym.normal(5,2)", "true");
  });
});

describe("sampleN", () => {
  testEvalToBe("pointMass(5) -> sampleN(10) -> sum", "50");
  testEvalToBe("pointMass(5) -> sampleN(10) -> sum", "50");

  testEvalToBe("normal(5, 2) -> sampleN(100) -> List.length", "100");
});

describe("Symbolic mean", () => {
  test("mean(triangular(x,y,z))", () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        async (x, y, z) => {
          if (!(x < y && y < z)) {
            try {
              const squiggleResult = await testRun(
                `mean(triangular(${x},${y},${z}))`
              );
              expect(squiggleResult.value).toBeCloseTo((x + y + z) / 3);
            } catch (err) {
              expect((err as Error).message).toEqual(
                "Expected squiggle expression to evaluate but got error: Distribution Math Error: Triangular values must be increasing order."
              );
            }
          }
        }
      )
    );
  });
});
