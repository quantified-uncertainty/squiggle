import { evaluateStringToResult } from "../../src/reducer/index.js";
import { testEvalToBe, testEvalToMatch } from "../helpers/reducerHelpers.js";

describe("annotations", () => {
  describe(".parameters", () => {
    testEvalToBe("f(x: [3,5]) = x; List.length(f.parameters)", "1");
    testEvalToBe("f(x: [3,5]) = x; f.parameters[0].name", '"x"');
    testEvalToBe("f(x: [3,5]) = x; f.parameters[0].domain.min", "3");
    testEvalToBe("f(x: [3,5]) = x; f.parameters[0].domain.max", "5");
  });

  describe("wrong annotation", () => {
    testEvalToBe(
      "f(x: [3]) = x",
      "Error(Argument Error: Expected two-value array)"
    );
  });

  describe("runtime checks", () => {
    testEvalToBe("f(x: [3,5]) = x*2; f(3)", "6");
    testEvalToBe("f(x: [3,5]) = x*2; f(4)", "8");
    testEvalToBe("f(x: [3,5]) = x*2; f(5)", "10");
    testEvalToMatch(
      "f(x: [3,5]) = x*2; f(6)",
      "Parameter 6 must be in domain Number.rangeDomain({ min: 3, max: 5 })"
    );
  });

  describe("explicit annotation object", () => {
    testEvalToBe(
      "f(x: Number.rangeDomain({ min: 3, max: 5 })) = x; f.parameters[0].domain.min",
      "3"
    );
  });

  describe("stack traces", () => {
    test("Stacktrace on annotation -> domain conversion", async () => {
      const result = await evaluateStringToResult(
        "g() = { f(x: [3,5,6]) = x; f }; h() = g(); h()"
      );
      if (result.ok) {
        throw new Error("expected error");
      }
      expect(result.value.toStringWithDetails())
        .toEqual(`Argument Error: Expected two-value array
Stack trace:
  g at line 1, column 14, file main
  h at line 1, column 39, file main
  <top> at line 1, column 44, file main`);
    });

    test("Stacktrace on domain checks", async () => {
      const result = await evaluateStringToResult(
        "f(x: [3,5]) = x; g() = f(6); g()"
      );
      if (result.ok) {
        throw new Error("expected error");
      }
      expect(result.value.toStringWithDetails())
        .toEqual(`Domain Error: Parameter 6 must be in domain Number.rangeDomain({ min: 3, max: 5 })
Stack trace:
  g at line 1, column 24, file main
  <top> at line 1, column 30, file main`);
    });
  });
});
