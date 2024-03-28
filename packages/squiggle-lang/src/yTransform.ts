import sum from "lodash/sum.js";
import uniq from "lodash/uniq.js";

import { T, XYShape } from "./XYShape.js";

export type Rectangle = { x1: number; x2: number; y: number };

export function convertToRectangles(shape: XYShape): {
  continuous: readonly Rectangle[];
  discrete: readonly [number, number][];
} {
  const rectangles: Rectangle[] = [];
  const discrete: [number, number][] = [];

  for (let i = 0; i < shape.xs.length - 1; i++) {
    const x1 = shape.xs[i];
    const x2 = shape.xs[i + 1];
    const y1 = shape.ys[i];
    const y2 = shape.ys[i + 1];
    if (y1 === y2) {
      discrete.push([y1, x2 - x1]);
    } else {
      const dx = x2 - x1;
      const dy = Math.abs(y2 - y1);
      const rectangularArea = Math.abs(dx) * Math.min(y1, y2);
      const triangularArea = 0.5 * Math.abs(dx) * Math.abs(dy); //This part is often ~minisule.
      const mass = rectangularArea + triangularArea;

      rectangles.push({
        x1: Math.min(y1, y2),
        x2: Math.max(y1, y2),
        y: mass / dy,
      });
    }
  }

  return { continuous: rectangles, discrete };
}

//[x,y] transformed discrete points
function mergeDiscrete(shape: readonly [number, number][]): [number, number][] {
  const pointMap = new Map<number, number>();

  for (const [x, y] of shape) {
    if (x !== 0 && y !== 0) {
      pointMap.set(x, (pointMap.get(x) || 0) + y);
    }
  }

  return Array.from(pointMap.entries(), ([x, y]) => [x, y * x]);
}

export function yTransformDiscrete(shape: XYShape): XYShape {
  const pointMap = new Map<number, number>();

  for (const [_, y] of T.zip(shape)) {
    if (y !== 0) {
      pointMap.set(y, (pointMap.get(y) || 0) + y);
    }
  }

  const sortedPoints = Array.from(pointMap.entries()).sort(([a], [b]) => a - b);
  return T.fromZippedArray(sortedPoints);
}

// Takes in a list of points and a list of ranges.
// For each point, outputs a list of the indices of each range that covered it.
// Example: ([2, 5, 5], [[1, 6], [3, 10]]) -> [[0], [0,1], [1]]
// Assumes that A is sorted by e[0]
function mapPointsToAllCoveringRanges(
  points: readonly number[],
  ranges: readonly [number, number][]
): number[][] {
  const result: number[][] = Array.from({ length: points.length }, () => []);

  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    // Binary search to find the first range that starts after the point
    let left = 0;
    let right = ranges.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (ranges[mid][0] > point) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    // Add the indices of all ranges that cover the point
    let j = right;
    while (j >= 0 && ranges[j][0] <= point) {
      if (ranges[j][1] >= point) {
        result[i].push(j);
      }
      j--;
    }
  }

  return result;
}

// [1, 2, 3] -> [[1, 2], [2, 3]]
function convertPointsToRanges(points: number[]): [number, number][] {
  return Array.from({ length: points.length - 1 }, (_, i) => [
    points[i],
    points[i + 1],
  ]);
}

function mergeRectanglesWithoutOverlap(
  rectangles: readonly Rectangle[]
): readonly Rectangle[] {
  if (rectangles.length === 0) {
    return [];
  }

  const sortedRectangles = [...rectangles].sort((a, b) => a.x1 - b.x1);
  const xPoints = uniq(
    rectangles.flatMap(({ x1, x2 }) => [x1, x2]).sort((a, b) => a - b)
  );
  const newRanges = convertPointsToRanges(xPoints);
  const rangeMiddlePoints = newRanges.map(([start, end]) => (start + end) / 2);
  const coveredRangeIndices = mapPointsToAllCoveringRanges(
    rangeMiddlePoints,
    sortedRectangles.map(({ x1, x2 }) => [x1, x2])
  );
  const indexY = (i: number) =>
    sum(coveredRangeIndices[i].map((j) => sortedRectangles[j].y));

  return newRanges.map(([x1, x2], i) => ({
    x1,
    x2,
    y: indexY(i),
  }));
}

function convertRectanglesToCoordinates(
  rectangles: readonly Rectangle[]
): readonly [number, number][] {
  type Point = [number, number];
  const points: Point[] = []; // [x,y][]

  for (let i = 0; i < rectangles.length; i++) {
    const rectangle = rectangles[i];
    const nextRectangle = rectangles[i + 1];
    const previousRectangle = rectangles[i - 1];
    const topLeft: Point = [rectangle.x1, rectangle.y];
    const topRight: Point = [rectangle.x2, rectangle.y];
    const bottomLeft0: Point = [rectangle.x1, 0];
    const bottomRight0: Point = [rectangle.x2, 0];

    if (i === 0) {
      points.push(bottomLeft0);
    }

    if (i > 0 && rectangle.x1 !== previousRectangle.x2) {
      points.push(bottomLeft0);
    }

    points.push(topLeft);
    points.push(topRight);

    if (i === rectangles.length - 1 || rectangle.x2 !== nextRectangle.x1) {
      points.push(bottomRight0);
    }
  }
  return points;
}

export function yTransformContinuous(shape: XYShape): {
  continuous: XYShape;
  discrete: XYShape;
} {
  // Step 1: Convert line segments into unordered small rectangles. Convert purely horizontal segments into discrete points.
  const continuousRectanglesAndDiscretePoints = convertToRectangles(shape);

  // Step 2: Merge rectangles into non-overlapping rectangles of corresponding heights
  const mergedRectanglesWithoutOverlap = mergeRectanglesWithoutOverlap(
    continuousRectanglesAndDiscretePoints.continuous
  );

  // Step 3: Convert non-overlapping rectangles into coordinates
  const continuous = convertRectanglesToCoordinates(
    mergedRectanglesWithoutOverlap
  );

  // Step 4: Merge overlapping discrete points
  const discrete = mergeDiscrete(
    continuousRectanglesAndDiscretePoints.discrete
  );

  // Step 5: Convert into XYShapes
  return {
    continuous: T.fromZippedArray(continuous),
    discrete: T.fromZippedArray(discrete),
  };
}
