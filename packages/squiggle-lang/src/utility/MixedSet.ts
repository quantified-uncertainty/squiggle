import sortBy from "lodash/sortBy.js";

import { extractSegments, XYShape } from "../XYShape.js";

type Range = [number, number];

// Gets all the parts of the set of the first set that are not covered by the support of the second set
const rangesDifference = (range1: Range[], range2: Range[]): Range[] => {
  const result: Range[] = [];
  let i = 0;
  let j = 0;

  while (i < range1.length && j < range2.length) {
    const [start1, end1] = range1[i];
    const [start2, end2] = range2[j];

    if (start2 > end1) {
      // No overlap, add the entire range from range1
      result.push([start1, end1]);
      i++;
    } else if (end2 < start1) {
      // No overlap, move to the next range in range2
      j++;
    } else {
      // Overlap found, split the range from range1
      if (start1 < start2) {
        result.push([start1, start2]);
      }
      if (end1 > end2) {
        range1[i][0] = end2; // Update the start of the current range in range1
        j++;
      } else {
        i++;
      }
    }
  }

  // Add any remaining ranges from range1
  while (i < range1.length) {
    result.push(range1[i]);
    i++;
  }

  return result;
};

export class MixedSet {
  public points: number[];
  public segments: Range[];

  constructor(points: number[], segments: Range[]) {
    this.points = points;
    this.segments = segments;
  }

  static fromDiscreteDistShape(shape: XYShape) {
    return new MixedSet(shape.xs.sort(), []);
  }

  static fromContinuousDistShape(shape: XYShape) {
    return new MixedSet(
      [],
      sortBy(
        extractSegments(shape, "greaterThan", 0).segments.map(
          (xyShape) =>
            [xyShape.xs[0], xyShape.xs[xyShape.xs.length - 1]] as [
              number,
              number,
            ]
        ),
        ([start, _]) => start
      )
    );
  }

  subtract(other: MixedSet): MixedSet {
    return new MixedSet(
      this.points.filter((x) => !other.points.includes(x)),
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
