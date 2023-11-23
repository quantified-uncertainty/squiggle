import { evaluateStringToResult } from "../../src/reducer/index.js";
import { testEvalToBe, testEvalToMatch } from "../helpers/reducerHelpers.js";

describe("annotations", () => {
  describe(".parameters", () => {
    testEvalToBe("f(x: [3,5]) = x; List.length(f.parameters)", "1");
    testEvalToBe("f(x: [3,5]) = x; f.parameters[0].name", '"x"');
    testEvalToBe("f(x: [3,5]) = x; f.parameters[0].domain.min", "3");
    testEvalToBe("f(x: [3,5]) = x; f.parameters[0].domain.max", "5");
    testEvalToBe(
      "f(x: [2000year,2021year]) = x; f.parameters[0].domain.max",
      "Fri Jan 01 2021"
    );
  });

  describe("wrong annotation", () => {
    testEvalToBe(
      "f(x: [3]) = x",
      "Error(Argument Error: Expected two-value array)"
    );
  });

  describe("different annotation types", () => {
    testEvalToBe(
      "f(x: [3, 2020year]) = x",
      "Error(Argument Error: The range minimum and maximum must be of the same type. Got Number and Date)"
    );
  });

  describe("runtime checks", () => {
    describe("check domain ranges", () => {
      testEvalToBe("f(x: [3,5]) = x*2; f(3)", "6");
      testEvalToBe("f(x: [3,5]) = x*2; f(4)", "8");
      testEvalToBe("f(x: [3,5]) = x*2; f(5)", "10");
      testEvalToBe(
        "f(x: [2000year,2005year]) = toYears(x-2000year)+3; f(2004year)",
        "7"
      );
      testEvalToMatch(
        "f(x: [3,5]) = x*2; f(6)",
        "Parameter 6 must be in domain Number.rangeDomain({ min: 3, max: 5 })"
      );
      testEvalToMatch(
        "f(x: [2000year,2005year]) = toYears(x-2000year)+3; f(2010year)",
        " Parameter Fri Jan 01 2010 must be in domain Date.rangeDomain({ min: Sat Jan 01 2000, max: Sat Jan 01 2005 })"
      );
    });
    describe("check types", () => {
      testEvalToBe(
        "f(x: [3,5]) = x*2; f(false)",
        "Error(Domain Error: Parameter false, of type Bool, must be a number.)"
      );
      testEvalToBe(
        "f(x: [3,5]) = x*2; f(2000year)",
        "Error(Domain Error: Parameter Sat Jan 01 2000, of type Date, must be a number.)"
      );

      testEvalToBe(
        "f(x: [2000year,2005year]) = toYears(x-2000year)+3; f(25)",
        "Error(Domain Error: Parameter 25, of type Number, must be a date.)"
      );
    });
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
