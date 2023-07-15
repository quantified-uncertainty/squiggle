import { domainToString, valueToDomain } from "../../src/value/domain.js";
import { vArray, vNumber } from "../../src/value/index.js";

describe("valueToDomain", () => {
  describe("numeric range", () => {
    test("two-item tuple", () => {
      const domainResult = valueToDomain(vArray([vNumber(3), vNumber(5)]));
      if (!domainResult.ok) {
        fail("expected ok result");
      }
      const domain = domainResult.value;
      expect(domain.type).toEqual("numericRange");
      expect(domain.min).toEqual(3);
      expect(domain.max).toEqual(5);
    });

    test("toString", () => {
      const domainResult = valueToDomain(vArray([vNumber(3), vNumber(5)]));
      if (!domainResult.ok) {
        fail("expected ok result");
      }
      const domain = domainResult.value;
      expect(domainToString(domain)).toEqual("Range(3 to 5)");
    });

    test("one-item array", () => {
      const domainResult = valueToDomain(vArray([vNumber(3)]));
      if (domainResult.ok) {
        fail("expected error result");
      }
      expect(domainResult.value.toString()).toBe(
        "Error: Expected two-value array"
      );
    });

    test("large array", () => {
      const domainResult = valueToDomain(
        vArray([vNumber(3), vNumber(10), vNumber(20)])
      );
      if (domainResult.ok) {
        fail("expected error result");
      }
      expect(domainResult.value.toString()).toBe(
        "Error: Expected two-value array"
      );
    });
  });
});
