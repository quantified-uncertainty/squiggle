import sortBy from "lodash/sortBy.js";

import { extractSegments, XYShape } from "../XYShape.js";

type Range = [number, number];

// Gets all the parts of the set of the first set that are not covered by the support of the second set
const rangesDifference = (range1: Range[], range2: Range[]): Range[] => {
  const result: Range[] = [];

  for (const [start1, end1] of range1) {
    const segments: Range[] = [[start1, end1]];

    for (const [start2, end2] of range2) {
      const newSegments: Range[] = [];

      for (const [segmentStart, segmentEnd] of segments) {
        if (start2 > segmentEnd || end2 < segmentStart) {
          // No overlap, keep the segment as is
          newSegments.push([segmentStart, segmentEnd]);
        } else {
          // Overlap found, split the segment
          if (segmentStart < start2) {
            newSegments.push([segmentStart, start2]);
          }
          if (segmentEnd > end2) {
            newSegments.push([end2, segmentEnd]);
          }
        }
      }

      segments.length = 0;
      segments.push(...newSegments);
    }

    result.push(...segments);
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
