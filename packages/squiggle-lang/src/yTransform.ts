import { epsilon_float } from "./magicNumbers.js";
import { pairwise } from "./utility/E_A.js";
import { T, XYShape } from "./XYShape.js";

export type Rectangle = { x1: number; x2: number; y: number };

export function convertToRectangles(shape: XYShape): {
  continuous: readonly Rectangle[];
  discrete: readonly [number, number][];
} {
  const rectangles: Rectangle[] = [];
  const discrete: [number, number][] = [];

  pairwise(T.zip(shape), ([x1, y1], [x2, y2]) => {
    if (y1 === y2) {
      discrete.push([y1, x2 - x1]);
    } else {
      const dx = x2 - x1;
      const dy = Math.abs(y2 - y1);
      const rectangularArea = Math.abs(dx) * Math.min(y1, y2);
      const triangularArea = 0.5 * Math.abs(dx) * Math.abs(dy); //This part is often ~minisule.
      const mass = rectangularArea + triangularArea;

      if (y1 > y2) {
        // Ensure that y1 is the smaller value
        [y1, y2] = [y2, y1];
      }
      rectangles.push({
        x1: y1,
        x2: y2,
        y: mass / dy,
      });
    }
  });

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

  for (const [, y] of T.zip(shape)) {
    if (y !== 0) {
      pointMap.set(y, (pointMap.get(y) || 0) + y);
    }
  }

  const sortedPoints = Array.from(pointMap.entries()).sort(([a], [b]) => a - b);
  return T.fromZippedArray(sortedPoints);
}

function mergeRectanglesWithoutOverlap(
  rectangles: readonly Rectangle[]
): readonly [number, number][] {
  const map = new Map<number, number>();
  for (const { x1, x2, y } of rectangles) {
    map.set(x1, (map.get(x1) || 0) + y);
    map.set(x2, (map.get(x2) || 0) - y);
  }

  const keys = [...map.keys()].sort((a, b) => a - b);

  const result: [number, number][] = [];
  let y = 0;
  for (let i = 0; i < keys.length; i++) {
    result.push([keys[i], y]);
    y += map.get(keys[i])!;
    result.push([keys[i] + epsilon_float, y]); // Add epsilon float because XYShape does not allow duplicate x-values
  }

  if (result.length) {
    result.at(-1)![1] = 0; // helps with rounding errors
  }

  return result;
}

export function yTransformContinuous(shape: XYShape): {
  continuous: XYShape;
  discrete: XYShape;
} {
  // Step 1: Convert line segments into unordered small rectangles. Convert purely horizontal segments into discrete points.
  const continuousRectanglesAndDiscretePoints = convertToRectangles(shape);

  // Step 2: Merge possibly overlapping rectangles into points
  const continuous = mergeRectanglesWithoutOverlap(
    continuousRectanglesAndDiscretePoints.continuous
  );

  // Step 3: Merge overlapping discrete points
  const discrete = mergeDiscrete(
    continuousRectanglesAndDiscretePoints.discrete
  );

  // Step 4: Convert into XYShapes
  return {
    continuous: T.fromZippedArray(continuous),
    discrete: T.fromZippedArray(discrete),
  };
}
