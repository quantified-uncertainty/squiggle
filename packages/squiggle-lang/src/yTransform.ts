import _ from "lodash";

import { T, XYShape } from "./XYShape.js";

export type Rectangle = { x1: number; x2: number; y: number };

export function convertToRectangles(shape: XYShape): {
  continuous: Rectangle[];
  discrete: [number, number][];
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

export function mergeDiscrete(shape: XYShape): XYShape {
  const points = T.zip(shape).filter((p) => p[0] !== 0);
  const xs = _.uniq(points.map((p) => p[0]));
  const newPoints: [number, number][] = xs.map((x) => [
    x,
    _.sum(points.filter((p) => p[0] === x).map((p) => p[1])) * x,
  ]);
  return T.fromZippedArray(newPoints);
}

export function yTransformDiscrete(shape: XYShape): XYShape {
  const points = T.zip(shape).filter((p) => p[1] !== 0);
  const ys = _.uniq(points.map((p) => p[1])).sort((a, b) => a - b);
  const newPoints: [number, number][] = ys.map((y) => [
    y,
    _.sum(points.filter((p) => p[1] === y).map((p) => p[1])),
  ]);
  return T.fromZippedArray(newPoints);
}

export function mergeRectanglesWithoutOverlap(
  rectangles: Rectangle[]
): Rectangle[] {
  if (rectangles.length === 0) {
    return [];
  }
  const xPoints = _.uniq(
    rectangles.flatMap((r) => [r.x1, r.x2]).sort((a, b) => a - b)
  );

  const sortedRectangles = rectangles.sort((a, b) => a.x1 - b.x1);
  const mergedRectangles: Rectangle[] = [];

  let currentIndex = 0;

  while (currentIndex < xPoints.length - 1) {
    const lastXPoint = xPoints[currentIndex];
    const nextXPoint = xPoints[currentIndex + 1];
    const inBetweenPoint = (lastXPoint + nextXPoint) / 2;
    const activeRectangles = sortedRectangles.filter(
      (r) => r.x1 < inBetweenPoint && r.x2 > inBetweenPoint
    );
    const yVal = _.sum(activeRectangles.map((r) => r.y));
    mergedRectangles.push({ x1: lastXPoint, x2: nextXPoint, y: yVal });
    currentIndex++;
  }

  return mergedRectangles;
}

export function mergeRectanglesToCoordinates(
  rectangles: Rectangle[]
): [number, number][] {
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
  // Step 1: Convert each line segment into a small rectangle
  const rectangles = convertToRectangles(shape);

  // Step 2: Merge rectangles into non-overlapping rectangles
  const mergedRectanglesWithoutOverlap = mergeRectanglesWithoutOverlap(
    rectangles.continuous
  );

  // Step 3: Merge overlapping rectangles into coordinates
  const continuous = T.fromZippedArray(
    mergeRectanglesToCoordinates(mergedRectanglesWithoutOverlap)
  );

  // Step 4: Convert discrete points into coordinates
  const discrete =
    (rectangles.discrete &&
      mergeDiscrete(T.fromZippedArray(rectangles.discrete))) ||
    T.empty;
  return { continuous, discrete };
}
