import { annotationToDomain } from "../../src/value/domain.js";
import { vArray, vNumber } from "../../src/value/index.js";

describe("valueToDomain", () => {
  describe("numeric range", () => {
    test("two-item tuple", () => {
      const domainResult = annotationToDomain(vArray([vNumber(3), vNumber(5)]));
      if (!domainResult.ok) {
        fail("expected ok result");
      }
      const domain = domainResult.value;
      expect(domain.type).toEqual("NumericRange");
      expect(domain.min).toEqual(3);
      expect(domain.max).toEqual(5);
    });

    test("min > max", () => {
      const domainResult = annotationToDomain(vArray([vNumber(5), vNumber(3)]));
      if (domainResult.ok) {
        fail("expected error result");
      }
      expect(domainResult.value.toString()).toBe(
        "Error: The range minimum (5) must be lower than the range maximum (3)"
      );
    });

    test("min = max", () => {
      const domainResult = annotationToDomain(vArray([vNumber(5), vNumber(5)]));
      if (domainResult.ok) {
        fail("expected error result");
      }
      expect(domainResult.value.toString()).toBe(
        "Error: The range minimum (5) must be lower than the range maximum (5)"
      );
    });

    test("toString", () => {
      const domainResult = annotationToDomain(vArray([vNumber(3), vNumber(5)]));
      if (!domainResult.ok) {
        fail("expected ok result");
      }
      const domain = domainResult.value;
      expect(domain.toString()).toEqual("Range(3 to 5)");
    });

    test("one-item array", () => {
      const domainResult = annotationToDomain(vArray([vNumber(3)]));
      if (domainResult.ok) {
        fail("expected error result");
      }
      expect(domainResult.value.toString()).toBe(
        "Error: Expected two-value array"
      );
    });

    test("large array", () => {
      const domainResult = annotationToDomain(
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
