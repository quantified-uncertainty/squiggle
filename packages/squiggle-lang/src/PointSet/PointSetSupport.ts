import { extractSegments, XYShape } from "../XYShape.js";

// Gets all the parts of the support of the first shape that are not covered by the support of the second shape
const segmentDifference = (
  support1: [number, number][],
  support2: [number, number][]
): [number, number][] => {
  const result: [number, number][] = [];

  for (const [start1, end1] of support1) {
    let segmentStart = start1;

    for (const [start2, end2] of support2) {
      if (start2 <= segmentStart && end2 >= segmentStart) {
        // Overlap found, adjust the segment start
        segmentStart = Math.max(segmentStart, end2);
      }
    }

    if (segmentStart <= end1) {
      // Non-overlapping segment found
      result.push([segmentStart, end1]);
    }
  }

  return result;
};

export class PointSetSupport {
  points: number[];
  segments: [number, number][];

  constructor(points: number[], segments: [number, number][]) {
    this.points = points;
    this.segments = segments;
  }

  static fromDiscreteShape(shape: XYShape) {
    return new PointSetSupport(shape.xs, []);
  }

  static fromContinuousShape(shape: XYShape) {
    return new PointSetSupport(
      [],
      extractSegments(shape, "greaterThan", 0).segments.map(
        (xyShape) => [xyShape.xs[0], xyShape.xs.at(-1)] as [number, number]
      )
    );
  }

  difference(other: PointSetSupport): PointSetSupport {
    return new PointSetSupport(
      this.points.filter((x) => !other.points.includes(x)),
      segmentDifference(this.segments, other.segments)
    );
  }

  empty(): boolean {
    return this.points.length === 0 && this.segments.length === 0;
  }

  minX(): number | undefined {
    if (this.empty()) {
      return undefined;
    }
    return Math.min(this.points[0], this.segments[0][0]);
  }

  maxX() {
    if (this.empty()) {
      return undefined;
    }
    return Math.max(
      this.points.at(-1) || -Infinity,
      this.segments.at(-1)?.[1] || -Infinity
    );
  }
}
