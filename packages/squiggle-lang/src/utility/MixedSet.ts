import sortBy from "lodash/sortBy.js";

import { extractSubsetThatSatisfiesThreshold, XYShape } from "../XYShape.js";

export type Range = readonly [number, number];

// Gets all the parts of the set of the first set that are not covered by the support of the second set
const rangesDifference = (
  range1: readonly Range[],
  range2: readonly Range[]
): Range[] => {
  const result: Range[] = [];
  const newRange1 = [...range1] as [number, number][]; // Make a copy of range1 to avoid modifying the original array. This will be mutated for this function, so we remove the `readonly` keyword from the type
  let i = 0;
  let j = 0;

  while (i < newRange1.length && j < range2.length) {
    const [start1, end1] = newRange1[i];
    const [start2, end2] = range2[j];

    if (start2 > end1) {
      // No overlap, add the entire range from newRange1
      result.push([start1, end1]);
      i++;
    } else if (end2 < start1) {
      // No overlap, move to the next range in range2
      j++;
    } else {
      // Overlap found, split the range from newRange1
      if (start1 < start2) {
        result.push([start1, start2]);
      }
      if (end1 > end2) {
        newRange1[i][0] = end2; // Update the start of the current range in newRange1
        j++;
      } else {
        i++;
      }
    }
  }

  // Add any remaining ranges from newRange1
  while (i < newRange1.length) {
    result.push(newRange1[i]);
    i++;
  }

  return result;
};

export class MixedSet {
  public readonly points: readonly number[];
  public readonly segments: readonly Range[];

  constructor(points: readonly number[], segments: readonly Range[]) {
    this.points = points;
    this.segments = segments;
  }

  static fromDiscreteDistShape(shape: XYShape) {
    return new MixedSet(shape.xs, []);
  }

  static fromContinuousDistShape(shape: XYShape) {
    return new MixedSet(
      [],
      sortBy(
        extractSubsetThatSatisfiesThreshold(
          shape,
          "greaterThan",
          0
        ).segments.map((xyShape) => [
          xyShape.xs[0],
          xyShape.xs[xyShape.xs.length - 1],
        ]),
        ([start, _]) => start
      )
    );
  }

  //Going forward, it would be good to use the same conventions as the Javascript Set class
  //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set

  difference(other: MixedSet): MixedSet {
    const otherPointsSet = new Set(other.points);
    return new MixedSet(
      this.points.filter((x) => !otherPointsSet.has(x)),
      rangesDifference(this.segments, other.segments)
    );
  }

  empty(): boolean {
    return this.points.length === 0 && this.segments.length === 0;
  }

  minX(): number | undefined {
    if (this.empty()) {
      return undefined;
    }
    return Math.min(
      this.points[0] ?? Infinity,
      this.segments[0]?.[0] ?? Infinity
    );
  }

  maxX(): number | undefined {
    if (this.empty()) {
      return undefined;
    }
    return Math.max(
      this.points[this.points.length - 1] ?? -Infinity,
      this.segments[this.segments.length - 1]?.[1] ?? -Infinity
    );
  }
}
