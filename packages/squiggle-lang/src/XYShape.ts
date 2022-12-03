import sortBy from "lodash/sortBy";
import * as E_A from "./utility/E_A";
import * as E_A_Floats from "./utility/E_A_Floats";
import * as E_A_Sorted from "./utility/E_A_Sorted";
import * as Result from "./utility/result";
import { epsilon_float } from "./magicNumbers";

export type XYShape = {
  xs: number[];
  ys: number[];
};

export type XYShapeError =
  | {
      tag: "NotSorted";
      property: string;
    }
  | {
      tag: "IsEmpty";
      property: string;
    }
  | {
      tag: "NotFinite";
      property: string;
      value: number;
    }
  | {
      tag: "DifferentLengths";
      p1Name: string;
      p2Name: string;
      p1Length: number;
      p2Length: number;
    }
  | {
      tag: "MultipleErrors";
      errors: XYShapeError[];
    };

export const XYShapeError = {
  mapErrorArrayToError(errors: XYShapeError[]): XYShapeError | undefined {
    if (errors.length === 0) {
      return undefined;
    } else if (errors.length === 1) {
      return errors[0];
    } else {
      return {
        tag: "MultipleErrors",
        errors,
      };
    }
  },
  toString(t: XYShapeError): string {
    switch (t.tag) {
      case "NotSorted":
        return `${t.property} is not sorted`;
      case "IsEmpty":
        return `${t.property} is empty`;
      case "NotFinite":
        return `${t.property} is not finite. Example value: ${t.value}`;
      case "DifferentLengths":
        return `${t.p1Name} and ${t.p2Name} have different lengths. ${t.p1Name} has length ${t.p1Length} and ${t.p2Name} has length ${t.p2Length}`;
      case "MultipleErrors":
        return `Multiple Errors: ${t.errors
          .map(XYShapeError.toString)
          .map((r) => `[${r}]`)
          .join(", ")}`;
    }
  },
};

// can be changed to enum after Typescript conversion is done
export type InterpolationStrategy = "Stepwise" | "Linear";
type ExtrapolationStrategy = "UseZero" | "UseOutermostPoints";

type Interpolator = (shape: XYShape, leftIndex: number, x: number) => number;

const interpolate = (
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  xIntended: number
): number => {
  const minProportion = (xMax - xIntended) / (xMax - xMin);
  const maxProportion = (xIntended - xMin) / (xMax - xMin);
  return yMin * minProportion + yMax * maxProportion;
};

// TODO: Make sure that shapes cannot be empty.
const extImp = <T>(value: T | undefined): T => {
  if (value === undefined) {
    throw new Error("Tried to perform an operation on an empty XYShape.");
  }
  return value;
};

export const T = {
  length(t: XYShape): number {
    return t.xs.length;
  },
  empty: { xs: [], ys: [] } as XYShape,
  isEmpty(t: XYShape): boolean {
    return T.length(t) === 0;
  },
  minX(t: XYShape) {
    return extImp(t.xs[0]);
  },
  maxX(t: XYShape) {
    return extImp(t.xs[t.xs.length - 1]);
  },
  firstY(t: XYShape) {
    return extImp(t.ys[0]);
  },
  lastY(t: XYShape) {
    return extImp(t.ys[t.ys.length - 1]);
  },
  xTotalRange(t: XYShape) {
    return T.maxX(t) - T.minX(t);
  },
  mapX(t: XYShape, fn: (x: number) => number): XYShape {
    return { xs: t.xs.map(fn), ys: t.ys };
  },
  mapY(t: XYShape, fn: (y: number) => number): XYShape {
    return { xs: t.xs, ys: t.ys.map(fn) };
  },
  mapYResult<E>(
    t: XYShape,
    fn: (y: number) => Result.t<number, E>
  ): Result.t<XYShape, E> {
    const mappedYs: number[] = [];
    for (const y of t.ys) {
      const mappedY = fn(y);
      if (!mappedY.ok) {
        return mappedY;
      }
      mappedYs.push(mappedY.value);
    }
    return Result.Ok({
      xs: t.xs,
      ys: mappedYs,
    });
  },
  square(t: XYShape): XYShape {
    return T.mapX(t, (x) => x ** 2);
  },
  zip({ xs, ys }: XYShape): [number, number][] {
    return E_A.zip(xs, ys);
  },
  fromArray([xs, ys]: [number[], number[]]): XYShape {
    return { xs, ys };
  },
  fromArrays(xs: number[], ys: number[]): XYShape {
    return { xs, ys };
  },
  accumulateYs(p: XYShape, fn: (y1: number, y2: number) => number): XYShape {
    return T.fromArray([p.xs, E_A.accumulate(p.ys, fn)]);
  },
  concat(t1: XYShape, t2: XYShape): XYShape {
    const cxs = [...t1.xs, ...t2.xs];
    const cys = [...t1.ys, ...t2.ys];
    return { xs: cxs, ys: cys };
  },
  fromZippedArray(pairs: [number, number][]): XYShape {
    return T.fromArray(E_A.unzip(pairs));
  },
  equallyDividedXs(t: XYShape, newLength: number): number[] {
    return E_A_Floats.range(T.minX(t), T.maxX(t), newLength);
  },
  toJs(t: XYShape) {
    return t;
  },
  filterYValues(t: XYShape, fn: (y: number) => number): XYShape {
    return T.fromZippedArray(T.zip(t).filter(([, y]) => fn(y)));
  },
  filterOkYs<B>(xs: number[], ys: Result.t<number, B>[]): XYShape {
    const n = xs.length; // Assume length(xs) == length(ys)
    const newXs: number[] = [];
    const newYs: number[] = [];
    for (let i = 0; i <= n - 1; i++) {
      const y = ys[i];
      if (y.ok) {
        newXs.push(xs[i]);
        newYs.push(y.value);
      }
    }
    return { xs: newXs, ys: newYs };
  },
  Validator: {
    notSortedError(p: string): XYShapeError {
      return {
        tag: "NotSorted",
        property: p,
      };
    },
    notFiniteError(p: string, exampleValue: number): XYShapeError {
      return {
        tag: "NotFinite",
        property: p,
        value: exampleValue,
      };
    },
    isEmptyError(propertyName: string): XYShapeError {
      return { tag: "IsEmpty", property: propertyName };
    },
    differentLengthsError(t: XYShape): XYShapeError {
      return {
        tag: "DifferentLengths",
        p1Name: "Xs",
        p2Name: "Ys",
        p1Length: t.xs.length,
        p2Length: t.ys.length,
      };
    },

    areXsSorted(t: XYShape): boolean {
      return E_A_Floats.isSorted(t.xs);
    },
    areXsEmpty(t: XYShape): boolean {
      return t.xs.length === 0;
    },
    getNonFiniteXs(t: XYShape): number | undefined {
      return t.xs.find((v) => !Number.isFinite(v));
    },
    getNonFiniteYs(t: XYShape): number | undefined {
      return t.ys.find((v) => !Number.isFinite(v));
    },
    validate(t: XYShape): XYShapeError | undefined {
      const errors: XYShapeError[] = [];
      if (!T.Validator.areXsSorted(t)) {
        errors.push(T.Validator.notSortedError("Xs"));
      }
      if (T.Validator.areXsEmpty(t)) {
        errors.push(T.Validator.isEmptyError("Xs"));
      }
      if (t.xs.length !== t.ys.length) {
        errors.push(T.Validator.differentLengthsError(t));
      }

      const nonFiniteX = T.Validator.getNonFiniteXs(t);
      if (nonFiniteX !== undefined) {
        errors.push(T.Validator.notFiniteError("Xs", nonFiniteX));
      }
      const nonFiniteY = T.Validator.getNonFiniteYs(t);
      if (nonFiniteY !== undefined) {
        errors.push(T.Validator.notFiniteError("Ys", nonFiniteY));
      }

      return XYShapeError.mapErrorArrayToError(errors);
    },
  },

  make(xs: number[], ys: number[]): Result.t<XYShape, XYShapeError> {
    const attempt: XYShape = { xs, ys };
    const maybeError = T.Validator.validate(attempt);
    if (maybeError) {
      return Result.Error(maybeError);
    } else {
      return Result.Ok(attempt);
    }
  },

  makeFromZipped(values: readonly (readonly [number, number])[]) {
    const [xs, ys] = E_A.unzip(values);
    return T.make(xs, ys);
  },
};

const Ts = {
  minX(t: XYShape[]): number {
    return Math.min(...t.map(T.minX));
  },
  maxX(t: XYShape[]): number {
    return Math.max(...t.map(T.maxX));
  },
  equallyDividedXs(t: XYShape[], newLength: number) {
    return E_A_Floats.range(Ts.minX(t), Ts.maxX(t), newLength);
  },
  allXs(t: XYShape[]): number[] {
    return E_A_Floats.sort(t.map((s) => s.xs).flat());
  },
};

const Pairs = {
  first(t: XYShape): [number, number] {
    return [T.minX(t), T.firstY(t)];
  },
  last(t: XYShape) {
    return [T.maxX(t), T.lastY(t)];
  },
  getBy(
    t: XYShape,
    fn: (xy: [number, number]) => boolean
  ): [number, number] | undefined {
    return T.zip(t).find(fn);
  },
  firstAtOrBeforeXValue(
    t: XYShape,
    xValue: number
  ): [number, number] | undefined {
    const firstGreaterIndex = E_A_Sorted.firstGreaterIndex(t.xs, xValue);
    if (firstGreaterIndex === 0) {
      return;
    }
    return [t.xs[firstGreaterIndex - 1], t.ys[firstGreaterIndex - 1]];
  },
};

export const YtoX = {
  linear(t: XYShape, y: number): number {
    const firstHigherIndex = E_A_Sorted.firstGreaterIndex(t.ys, y);
    if (firstHigherIndex === t.ys.length) {
      return T.maxX(t); // FIXME - check if this is correct
    } else if (firstHigherIndex === 0) {
      return T.minX(t); // FIXME
    } else {
      const lowerOrEqualIndex = firstHigherIndex - 1;
      if (t.ys[lowerOrEqualIndex] === y) {
        return t.xs[lowerOrEqualIndex];
      } else {
        // needs interpolation
        return interpolate(
          t.ys[lowerOrEqualIndex],
          t.ys[firstHigherIndex],
          t.xs[lowerOrEqualIndex],
          t.xs[firstHigherIndex],
          y
        );
      }
    }
  },
};

export const XtoY = {
  stepwiseIncremental(t: XYShape, x: number): number | undefined {
    return Pairs.firstAtOrBeforeXValue(t, x)?.[1];
  },

  stepwiseIfAtX(t: XYShape, f: number) {
    return Pairs.getBy(t, ([x]) => x === f)?.[1];
  },
  linear(t: XYShape, x: number): number {
    const firstHigherIndex = E_A_Sorted.firstGreaterIndex(t.xs, x);
    if (firstHigherIndex === t.xs.length) {
      return T.lastY(t); // FIXME - should be 0? https://github.com/quantified-uncertainty/squiggle/issues/1401
    } else if (firstHigherIndex === 0) {
      return T.firstY(t); // FIXME
    } else {
      const lowerOrEqualIndex = firstHigherIndex - 1;
      if (t.xs[lowerOrEqualIndex] === x) {
        return t.ys[lowerOrEqualIndex];
      } else {
        // needs interpolation
        return interpolate(
          t.xs[lowerOrEqualIndex],
          t.xs[firstHigherIndex],
          t.ys[lowerOrEqualIndex],
          t.ys[firstHigherIndex],
          x
        );
      }
    }
  },

  /* Returns a between-points-interpolating function that can be used with PointwiseCombination.combine.
     Interpolation can either be stepwise (using the value on the left) or linear. Extrapolation can be `UseZero or `UseOutermostPoints`. */
  continuousInterpolator(
    interpolation: InterpolationStrategy,
    extrapolation: ExtrapolationStrategy
  ): Interpolator {
    if (interpolation === "Linear" && extrapolation === "UseZero") {
      return (t: XYShape, leftIndex: number, x: number) => {
        if (leftIndex < 0) {
          return 0;
        } else if (leftIndex >= T.length(t) - 1) {
          return 0;
        } else {
          const x1 = t.xs[leftIndex];
          const x2 = t.xs[leftIndex + 1];
          const y1 = t.ys[leftIndex];
          const y2 = t.ys[leftIndex + 1];
          const fraction = (x - x1) / (x2 - x1);
          return y1 * (1 - fraction) + y2 * fraction;
        }
      };
    } else if (
      interpolation === "Linear" &&
      extrapolation === "UseOutermostPoints"
    ) {
      return (t: XYShape, leftIndex: number, x: number) => {
        if (leftIndex < 0) {
          return t.ys[0];
        } else if (leftIndex >= T.length(t) - 1) {
          return t.ys[T.length(t) - 1];
        } else {
          const x1 = t.xs[leftIndex];
          const x2 = t.xs[leftIndex + 1];
          const y1 = t.ys[leftIndex];
          const y2 = t.ys[leftIndex + 1];
          const fraction = (x - x1) / (x2 - x1);
          return y1 * (1 - fraction) + y2 * fraction;
        }
      };
    } else if (interpolation === "Stepwise" && extrapolation === "UseZero") {
      return (t: XYShape, leftIndex: number, _x: number) => {
        if (leftIndex < 0) {
          return 0;
        } else if (leftIndex >= T.length(t) - 1) {
          return 0;
        } else {
          return t.ys[leftIndex];
        }
      };
    } else if (
      interpolation === "Stepwise" &&
      extrapolation === "UseOutermostPoints"
    ) {
      return (t: XYShape, leftIndex: number, _x: number) => {
        if (leftIndex < 0) {
          return t.ys[0];
        } else if (leftIndex >= T.length(t) - 1) {
          return t.ys[T.length(t) - 1];
        } else {
          return t.ys[leftIndex];
        }
      };
    } else {
      throw new Error(
        "Implementation error: invalid interpolation/extrapolation strategy combination"
      ); // should never happen
    }
  },
  /* Returns a between-points-interpolating function that can be used with PointwiseCombination.combine.
     For discrete distributions, the probability density between points is zero, so we just return zero here. */
  discreteInterpolator: (() => 0) as Interpolator,
};

export const XsConversion = {
  _replaceWithXs(newXs: number[], t: XYShape): XYShape {
    const newYs = newXs.map((x) => XtoY.linear(t, x));
    return { xs: newXs, ys: newYs };
  },

  equallyDivideXByMass(integral: XYShape, newLength: number): number[] {
    return E_A_Floats.range(0, 1, newLength).map((y) =>
      YtoX.linear(integral, y)
    );
  },

  proportionEquallyOverX(t: XYShape, newLength: number): XYShape {
    return XsConversion._replaceWithXs(T.equallyDividedXs(t, newLength), t);
  },
  proportionByProbabilityMass(
    t: XYShape,
    newLength: number,
    integral: XYShape
  ): XYShape {
    return XsConversion._replaceWithXs(
      XsConversion.equallyDivideXByMass(integral, newLength),
      t
    ); // creates a new set of xs at evenly spaced percentiles // linearly interpolates new ys for the new xs
  },
};

type Zipped = [number, number][];
export const Zipped = {
  sortByY(t: Zipped) {
    return sortBy(t, [([x, y]) => y]);
  },
  sortByX(t: Zipped) {
    return sortBy(t, [([x, y]) => x]);
  },
  filterByX(t: Zipped, testFn: (x: number) => boolean) {
    return t.filter(([x]) => testFn(x));
  },
};

export const PointwiseCombination = {
  // t1 and t2 are interpolator functions from XYShape.XtoY.
  combine<E>(
    interpolator: Interpolator,
    fn: (a: number, b: number) => Result.t<number, E>,
    t1: XYShape,
    t2: XYShape
  ): Result.t<XYShape, E> {
    // This function combines two xyShapes by looping through both of them simultaneously.
    // It always moves on to the next smallest x, whether that's in the first or second input's xs,
    // and interpolates the value on the other side, thus accumulating xs and ys.
    // This is written in raw JS because this can still be a bottleneck, and using refs for the i and j indices is quite painful.
    const t1n = t1.xs.length;
    const t2n = t2.xs.length;
    const outX: number[] = [];
    const outY: number[] = [];
    let i = -1;
    let j = -1;

    while (i <= t1n - 1 && j <= t2n - 1) {
      let x, ya, yb;
      if ((j === t2n - 1 && i < t1n - 1) || t1.xs[i + 1] < t2.xs[j + 1]) {
        // if a has to catch up to b, or if b is already done
        i++;

        x = t1.xs[i];
        ya = t1.ys[i];

        yb = interpolator(t2, j, x);
      } else if (
        (i === t1n - 1 && j < t2n - 1) ||
        t1.xs[i + 1] > t2.xs[j + 1]
      ) {
        // if b has to catch up to a, or if a is already done
        j++;

        x = t2.xs[j];
        yb = t2.ys[j];

        ya = interpolator(t1, i, x);
      } else if (i < t1n - 1 && j < t2n && t1.xs[i + 1] === t2.xs[j + 1]) {
        // if they happen to be equal, move both ahead
        i++;
        j++;
        x = t1.xs[i];
        ya = t1.ys[i];
        yb = t2.ys[j];
      } else if (i === t1n - 1 && j === t2n - 1) {
        // finished!
        i = t1n;
        j = t2n;
        continue;
      } else {
        throw new Error(`PointwiseCombination error: ${i}, ${j}`);
      }

      outX.push(x);

      // Here I check whether the operation was a success. If it was
      // keep going. Otherwise, stop and throw the error back to user
      const newY = fn(ya, yb);
      if (!newY.ok) {
        return newY;
      }
      outY.push(newY.value);
    }

    return Result.Ok({ xs: outX, ys: outY });
  },

  //   /*
  //     This is from an approach to kl divergence that was ultimately rejected. Leaving it in for now because it may help us factor `combine` out of raw javascript soon.
  //  */
  //   let combineAlongSupportOfSecondArgument0: (
  //     interpolator,
  //     (float, float) => result<float, Operation.Error.t>,
  //     T.t,
  //     T.t,
  //   ) => result<T.t, Operation.Error.t> = (interpolator, fn, t1, t2) => {
  //     let newYs = []
  //     let newXs = []
  //     let (l1, l2) = (E.A.length(t1.xs), E.A.length(t2.xs))
  //     let (i, j) = (ref(0), ref(0))
  //     let minX = t2.xs[0]
  //     let maxX = t2.xs[l2 - 1]
  //     while j.contents < l2 - 1 && i.contents < l1 - 1 {
  //       let someTuple = {
  //         let x1 = t1.xs[i.contents + 1]
  //         let x2 = t2.xs[j.contents + 1]
  //         if (
  //           /* if t1 has to catch up to t2 */
  //           i.contents < l1 - 1 && j.contents < l2 && x1 < x2 && minX <= x1 && x2 <= maxX
  //         ) {
  //           i := i.contents + 1
  //           let x = x1
  //           let y1 = t1.ys[i.contents]
  //           let y2 = interpolator(t2, j.contents, x)
  //           Some((x, y1, y2))
  //         } else if (
  //           /* if t2 has to catch up to t1 */
  //           i.contents < l1 && j.contents < l2 - 1 && x1 > x2 && x2 >= minX && maxX >= x1
  //         ) {
  //           j := j.contents + 1
  //           let x = x2
  //           let y1 = interpolator(t1, i.contents, x)
  //           let y2 = t2.ys[j.contents]
  //           Some((x, y1, y2))
  //         } else if (
  //           /* move both ahead if they are equal */
  //           i.contents < l1 - 1 && j.contents < l2 - 1 && x1 == x2 && x1 >= minX && maxX >= x2
  //         ) {
  //           i := i.contents + 1
  //           j := j.contents + 1
  //           let x = x1
  //           let y1 = t1.ys[i.contents]
  //           let y2 = t2.ys[j.contents]
  //           Some((x, y1, y2))
  //         } else {
  //           i := i.contents + 1
  //           None
  //         }
  //       }
  //       switch someTuple {
  //       | Some((x, y1, y2)) => {
  //           let _ = Js.Array.push(fn(y1, y2), newYs)
  //           let _ = Js.Array.push(x, newXs)
  //         }

  //       | None => ()
  //       }
  //     }
  //     T.filterOkYs(newXs, newYs)->Ok
  //   }

  //   /* *Dead code*: Nuño wrote this function to try to increase precision, but it didn't work.
  //      If another traveler comes through with a similar idea, we hope this implementation will help them.
  //      By "enrich" we mean to increase granularity.
  //  */
  //   let enrichXyShape = (t: T.t): T.t => {
  //     let defaultEnrichmentFactor = 10
  //     let length = E.A.length(t.xs)
  //     let points =
  //       length < MagicNumbers.Environment.defaultXYPointLength
  //         ? defaultEnrichmentFactor * MagicNumbers.Environment.defaultXYPointLength / length
  //         : defaultEnrichmentFactor

  //     let getInBetween = (x1: float, x2: float): array<float> => {
  //       if abs_float(x1 -. x2) < 2.0 *. MagicNumbers.Epsilon.seven {
  //         [x1]
  //       } else {
  //         let newPointsArray = E.A.makeBy(points - 1, i => i)
  //         // don't repeat the x2 point, it will be gotten in the next iteration.
  //         let result = Js.Array.mapi((pos, i) =>
  //           if i == 0 {
  //             x1
  //           } else {
  //             let points' = Belt.Float.fromInt(points)
  //             let pos' = Belt.Float.fromInt(pos)
  //             x1 *. (points' -. pos') /. points' +. x2 *. pos' /. points'
  //           }
  //         , newPointsArray)
  //         result
  //       }
  //     }
  //     let newXsUnflattened = Js.Array.mapi(
  //       (x, i) => i < length - 2 ? getInBetween(x, t.xs[i + 1]) : [x],
  //       t.xs,
  //     )
  //     let newXs = E.A.concatMany(newXsUnflattened)
  //     let newYs = E.A.fmap(newXs, x => XtoY.linear(t, x))
  //     {xs: newXs, ys: newYs}
  //   }

  addCombine(interpolator: Interpolator, t1: XYShape, t2: XYShape): XYShape {
    const result = PointwiseCombination.combine(
      interpolator,
      (a, b) => Result.Ok(a + b),
      t1,
      t2
    );
    if (!result.ok) {
      throw new Error("Add operation should never fail");
    }
    return result.value;
  },
};

// I'm really not sure this part is actually what we want at this point.
// ((lastX, lastY), (nextX, nextY))
type ZippedRange = [[number, number], [number, number]];
export const Range = {
  nextX([, [nextX]]: ZippedRange) {
    return nextX;
  },

  rangePointAssumingSteps([[, lastY], [nextX]]: ZippedRange) {
    return [nextX, lastY];
  },

  rangeAreaAssumingTriangles([[lastX, lastY], [nextX, nextY]]: ZippedRange) {
    return ((nextX - lastX) * (lastY + nextY)) / 2;
  },

  //Todo: figure out how to without making new array.
  rangeAreaAssumingTrapezoids([[lastX, lastY], [nextX, nextY]]: ZippedRange) {
    return (nextX - lastX) * (Math.min(lastY, nextY) + (lastY + nextY) / 2);
  },

  delta_y_over_delta_x([[lastX, lastY], [nextX, nextY]]: ZippedRange) {
    return (nextY - lastY) / (nextX - lastX);
  },

  mapYsBasedOnRanges(
    t: XYShape,
    fn: (r: ZippedRange) => number
  ): [number, number][] | undefined {
    const ranges = E_A.toRanges(E_A.zip(t.xs, t.ys));
    if (!ranges.ok) {
      return undefined; // probably length=1
    }
    return ranges.value.map((r) => [Range.nextX(r), fn(r)]);
  },

  integrateWithTriangles({ xs, ys }: XYShape) {
    const length = xs.length;
    const cumulativeY: number[] = new Array(length).fill(0);
    for (let x = 0; x <= length - 2; x++) {
      cumulativeY[x + 1] =
        (xs[x + 1] - xs[x]) * ((ys[x] + ys[x + 1]) / 2) + cumulativeY[x]; // dx // (1/2) * (avgY)
    }
    return { xs, ys: cumulativeY };
  },

  derivative(t: XYShape) {
    return Range.mapYsBasedOnRanges(t, Range.delta_y_over_delta_x);
  },

  stepwiseToLinear({ xs, ys }: XYShape): XYShape {
    // adds points at the bottom of each step.
    const length = xs.length;
    const newXs: number[] = new Array(2 * length);
    const newYs: number[] = new Array(2 * length);

    newXs[0] = xs[0] - epsilon_float;
    newYs[0] = 0;
    newXs[1] = xs[0];
    newYs[1] = ys[0];

    for (let i = 1; i <= length - 1; i++) {
      newXs[i * 2] = xs[i] - epsilon_float;
      newYs[i * 2] = ys[i - 1];
      newXs[i * 2 + 1] = xs[i];
      newYs[i * 2 + 1] = ys[i];
    }

    return { xs: newXs, ys: newYs };
  },
};

export const Analysis = {
  getVarianceDangerously<T>(
    t: T,
    mean: (t: T) => number,
    getMeanOfSquares: (t: T) => number
  ): number {
    const meanSquared = mean(t) ** 2;
    const meanOfSquares = getMeanOfSquares(t);
    return meanOfSquares - meanSquared;
  },
};
