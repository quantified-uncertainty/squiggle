import {
  removeLambdas,
  SimpleValue,
  simpleValueFromAny,
  SimpleValueWithoutLambda,
  summarizeSimpleValueWithoutLambda,
} from "../../src/value/simpleValue.js";
import { testRun } from "../helpers/helpers.js";

async function runAndSummarize(code: string): Promise<string> {
  const result = await testRun(code);
  const simpleValue: SimpleValue = simpleValueFromAny(result.result.asJS());
  const withoutLambdas: SimpleValueWithoutLambda = removeLambdas(simpleValue);
  return summarizeSimpleValueWithoutLambda(withoutLambdas, 0, 8);
}

describe("summarizeSimpleValueForLLM", () => {
  test("Often simplifies", async () => {
    const result = await runAndSummarize(
      "[10422.1084010465, 6830.45370946499, 5277.15097588727, 7703.06187039825, 6293.52175481825]"
    );
    expect(result).toBe(
      "[10422.1084010465, 6830.45370946499, 5277.15097588727, 7703.06187039825, 6293.52175481825]"
    );
  });

  test("Simple primitive values", async () => {
    expect(await runAndSummarize("5")).toBe("5");
    expect(await runAndSummarize('"test"')).toBe('"test"');
    expect(await runAndSummarize("true")).toBe("true");
  });

  test("Very similar numbers with small differences", async () => {
    const result = await runAndSummarize(
      "[1.00000000000001, 1.00000000000002, 1.00000000000003]"
    );
    expect(result).toBe(
      "[1.00000000000001, 1.00000000000002, 1.00000000000003]"
    );
  });

  test("Numbers with varying scales", async () => {
    const result = await runAndSummarize(
      "[0.000000001, 0.001, 1, 1000, 1000000]"
    );
    expect(result).toBe("[1e-9, 0.001, 1, 1000, 1000000]");
  });

  test("Mix of integers and decimals", async () => {
    const result = await runAndSummarize(
      "[100, 100.1, 100.01, 100.001, 100.0001]"
    );
    expect(result).toBe("[100, 100.1, 100.01, 100.001, 100.0001]");
  });

  test("Negative numbers", async () => {
    const result = await runAndSummarize(
      "[-1.23456789, -1.23456788, -1.23456790]"
    );
    expect(result).toBe("[-1.23456789, -1.23456788, -1.2345679]");
  });

  test("Mix of similar and dissimilar numbers", async () => {
    const result = await runAndSummarize("[1.0001, 1.0002, 1.0003, 2, 3, 4]");
    expect(result).toBe("[1.0001, 1.0002, 1.0003, 2, 3, 4, ...6 total]");
  });

  test("Numbers with many decimal places", async () => {
    const result = await runAndSummarize(
      "[3.14159265358979, 3.14159265358980, 3.14159265358981]"
    );
    expect(result).toBe(
      "[3.14159265358979, 3.1415926535898, 3.14159265358981]"
    );
  });

  test("Numbers with common prefix but different scales", async () => {
    const result = await runAndSummarize("[1.000001, 1.001, 1.1, 1.9]");
    expect(result).toBe("[1.000001, 1.001, 1.1, 1.9]");
  });

  test("Very large and very small numbers", async () => {
    const result = await runAndSummarize("[1e-100, 1e100, 1e-99, 1e99]");
    expect(result).toBe("[1e-100, 1e100, 1e-99, 1e99]");
  });

  test("complex object", async () => {
    const result = await runAndSummarize(
      `x = {foo: {bar: 1 to 5}}
      y = 5000 to 10000
      z(f) = f + 3
      {x,y,z}`
    );
    expect(result).toBe(`{
       vtype: "Dict",
       value: {
         x: {
           vtype: "Dict",
           value: {
             foo: {
               vtype: "Dict",
               value: {
                 bar: {
                   vType: "SampleSetDist",
                   samples: [2.27158204570878, 1.92312606758186, 2.24918511608805, 3.26827328560333, 2.54064310270752, ...1000 total],
                   summary: {
                     mean: ...,
                     p5: ...,
                     p50: ...,
                     p95: ...
                   }
                 }
               }
             }
           }
         },
         y: {
           vType: "SampleSetDist",
           samples: [10422.1084010465, 6830.45370946499, 5277.15097588727, 7703.06187039825, 6293.52175481825, ...1000 total],
           summary: {
             mean: 7195.86638546135,
             p5: 4845.18842622905,
             p50: 7029.61303004548,
             p95: 9840.27710007229
           }
         },
         z: {
           vType: "Lambda",
           toString: "(f) => internal code",
           paramenterString: "f"
         }
       }
     }

 }`);
  });
});
