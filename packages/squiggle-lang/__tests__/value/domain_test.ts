import { annotationToDomain } from "../../src/value/domain.js";
import { vArray, vNumber } from "../../src/value/index.js";

describe("valueToDomain", () => {
  describe("numeric range", () => {
    test("two-item tuple", () => {
      const domain = annotationToDomain(vArray([vNumber(3), vNumber(5)]));
      expect(domain.type).toEqual("NumericRange");
      expect(domain.min).toEqual(3);
      expect(domain.max).toEqual(5);
    });

    test("min > max", () => {
      expect(() =>
        annotationToDomain(vArray([vNumber(5), vNumber(3)]))
      ).toThrow(
        "The range minimum (5) must be lower than the range maximum (3)"
      );
    });

    test("min = max", () => {
      expect(() =>
        annotationToDomain(vArray([vNumber(5), vNumber(5)]))
      ).toThrow(
        "The range minimum (5) must be lower than the range maximum (5)"
      );
    });

    test("toString", () => {
      const domain = annotationToDomain(vArray([vNumber(3), vNumber(5)]));
      expect(domain.toString()).toEqual(
        "Number.rangeDomain({ min: 3, max: 5 })"
      );
    });

    test("one-item array", () => {
      expect(() => annotationToDomain(vArray([vNumber(3)]))).toThrow(
        "Expected two-value array"
      );
    });

    test("large array", () => {
      expect(() =>
        annotationToDomain(vArray([vNumber(3), vNumber(10), vNumber(20)]))
      ).toThrow("Expected two-value array");
    });
  });
});
