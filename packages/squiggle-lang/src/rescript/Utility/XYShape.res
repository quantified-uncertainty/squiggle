@genType
type xyShape = {
  xs: array<float>,
  ys: array<float>,
}

type propertyName = string

@genType
type rec error =
  | NotSorted(propertyName)
  | IsEmpty(propertyName)
  | NotFinite(propertyName, float)
  | DifferentLengths({p1Name: string, p2Name: string, p1Length: int, p2Length: int})
  | MultipleErrors(array<error>)

@genType
module Error = {
  let mapErrorArrayToError = (errors: array<error>): option<error> => {
    switch errors {
    | [] => None
    | [error] => Some(error)
    | _ => Some(MultipleErrors(errors))
    }
  }

  let rec toString = (t: error) =>
    switch t {
    | NotSorted(propertyName) => `${propertyName} is not sorted`
    | IsEmpty(propertyName) => `${propertyName} is empty`
    | NotFinite(propertyName, exampleValue) =>
      `${propertyName} is not finite. Example value: ${E.Float.toString(exampleValue)}`
    | DifferentLengths({p1Name, p2Name, p1Length, p2Length}) =>
      `${p1Name} and ${p2Name} have different lengths. ${p1Name} has length ${E.I.toString(
          p1Length,
        )} and ${p2Name} has length ${E.I.toString(p2Length)}`
    | MultipleErrors(errors) =>
      `Multiple Errors: ${E.A.fmap(errors, toString)->E.A.fmap(r => `[${r}]`)->E.A.joinWith(", ")}`
    }
}

@genType
type interpolationStrategy = [
  | #Stepwise
  | #Linear
]

@genType
type extrapolationStrategy = [
  | #UseZero
  | #UseOutermostPoints
]

type interpolator = (xyShape, int, float) => float

let interpolate = (xMin: float, xMax: float, yMin: float, yMax: float, xIntended: float): float => {
  let minProportion = (xMax -. xIntended) /. (xMax -. xMin)
  let maxProportion = (xIntended -. xMin) /. (xMax -. xMin)
  yMin *. minProportion +. yMax *. maxProportion
}

// TODO: Make sure that shapes cannot be empty.
let extImp = E.O.toExt(_, "Tried to perform an operation on an empty XYShape.")

module T = {
  type t = xyShape
  let toXyShape = (t: t): xyShape => t
  type ts = array<xyShape>
  let xs = (t: t) => t.xs
  let ys = (t: t) => t.ys
  let length = (t: t) => E.A.length(t.xs)
  let empty = {xs: [], ys: []}
  let isEmpty = (t: t) => length(t) == 0
  let minX = (t: t) => t->xs->E.A.Sorted.min->extImp
  let maxX = (t: t) => t->xs->E.A.Sorted.max->extImp
  let firstY = (t: t) => t->ys->E.A.first->extImp
  let lastY = (t: t) => t->ys->E.A.last->extImp
  let xTotalRange = (t: t) => maxX(t) -. minX(t)
  let mapX = (t: t, fn): t => {xs: E.A.fmap(t.xs, fn), ys: t.ys}
  let mapY = (t: t, fn): t => {xs: t.xs, ys: E.A.fmap(t.ys, fn)}
  let mapYResult = (t: t, fn: float => result<float, 'e>): result<t, 'e> => {
    let mappedYs = E.A.fmap(t.ys, fn)
    E.A.R.firstErrorOrOpen(mappedYs)->E.R.fmap(y => {xs: t.xs, ys: y})
  }
  let square = mapX(_, x => x ** 2.0)
  let zip = ({xs, ys}: t) => E.A.zip(xs, ys)
  let fromArray = ((xs, ys)): t => {xs, ys}
  let fromArrays = (xs, ys): t => {xs, ys}
  let accumulateYs = (p: t, fn) => (p.xs, p.ys->E.A.accumulate(fn))->fromArray
  let concat = (t1: t, t2: t) => {
    let cxs = E.A.concat(t1.xs, t2.xs)
    let cys = E.A.concat(t1.ys, t2.ys)
    {xs: cxs, ys: cys}
  }
  let fromZippedArray = (pairs: array<(float, float)>): t => pairs->E.A.unzip->fromArray
  let equallyDividedXs = (t: t, newLength) => E.A.Floats.range(minX(t), maxX(t), newLength)
  let toJs = (t: t) => {"xs": t.xs, "ys": t.ys}
  let filterYValues = (t: t, fn): t => t->zip->E.A.filter(((_, y)) => fn(y))->fromZippedArray
  let filterOkYs = (xs: array<float>, ys: array<result<float, 'b>>): t => {
    let n = E.A.length(xs) // Assume length(xs) == length(ys)
    let newXs = []
    let newYs = []
    for i in 0 to n - 1 {
      switch ys[i] {
      | Ok(y) =>
        let _ = Js.Array.push(xs[i], newXs)
        let _ = Js.Array.push(y, newYs)
      | Error(_) => ()
      }
    }
    {xs: newXs, ys: newYs}
  }
  module Validator = {
    let fnName = "XYShape validate"
    let notSortedError = (p: string): error => NotSorted(p)
    let notFiniteError = (p, exampleValue): error => NotFinite(p, exampleValue)
    let isEmptyError = (propertyName): error => IsEmpty(propertyName)
    let differentLengthsError = (t): error => DifferentLengths({
      p1Name: "Xs",
      p2Name: "Ys",
      p1Length: E.A.length(xs(t)),
      p2Length: E.A.length(ys(t)),
    })

    let areXsSorted = (t: t) => E.A.Floats.isSorted(xs(t))
    let areXsEmpty = (t: t) => E.A.length(xs(t)) == 0
    let getNonFiniteXs = (t: t) => t->xs->E.A.Floats.getNonFinite
    let getNonFiniteYs = (t: t) => t->ys->E.A.Floats.getNonFinite

    let validate = (t: t) => {
      let xsNotSorted = areXsSorted(t) ? None : Some(notSortedError("Xs"))
      let xsEmpty = areXsEmpty(t) ? Some(isEmptyError("Xs")) : None
      let differentLengths =
        E.A.length(xs(t)) !== E.A.length(ys(t)) ? Some(differentLengthsError(t)) : None
      let xsNotFinite = getNonFiniteXs(t)->E.O.fmap(notFiniteError("Xs"))
      let ysNotFinite = getNonFiniteYs(t)->E.O.fmap(notFiniteError("Ys"))
      [xsNotSorted, xsEmpty, differentLengths, xsNotFinite, ysNotFinite]
      ->E.A.O.concatSomes
      ->Error.mapErrorArrayToError
    }
  }

  let make = (~xs: array<float>, ~ys: array<float>) => {
    let attempt: t = {xs, ys}
    switch Validator.validate(attempt) {
    | Some(error) => Error(error)
    | None => Ok(attempt)
    }
  }

  let makeFromZipped = (values: array<(float, float)>) => {
    let (xs, ys) = E.A.unzip(values)
    make(~xs, ~ys)
  }
}

module Ts = {
  type t = T.ts
  let minX = (t: t) => t->E.A.fmap(T.minX)->E.A.Floats.min
  let maxX = (t: t) => t->E.A.fmap(T.maxX)->E.A.Floats.max
  let equallyDividedXs = (t: t, newLength) => E.A.Floats.range(minX(t), maxX(t), newLength)
  let allXs = (t: t) => t->E.A.fmap(T.xs)->E.A.Sorted.concatMany
}

module Pairs = {
  let x = fst
  let y = snd
  let first = (t: T.t) => (T.minX(t), T.firstY(t))
  let last = (t: T.t) => (T.maxX(t), T.lastY(t))

  let getBy = (t: T.t, fn) => t->T.zip->E.A.getBy(fn)

  let firstAtOrBeforeXValue = (t: T.t, xValue) => {
    let zipped = T.zip(t)
    let firstIndex = zipped->E.A.getIndexBy(((x, _)) => x > xValue)
    let previousIndex = switch firstIndex {
    | None => Some(E.A.length(zipped) - 1)
    | Some(0) => None
    | Some(n) => Some(n - 1)
    }
    previousIndex->Belt.Option.flatMap(E.A.get(zipped))
  }
}

module YtoX = {
  let linear = (t: T.t, y: float): float => {
    let firstHigherIndex = E.A.Sorted.binarySearchFirstElementGreaterIndex(T.ys(t), y)
    let foundX = switch firstHigherIndex {
    | #overMax => T.maxX(t)
    | #underMin => T.minX(t)
    | #firstHigher(firstHigherIndex) =>
      let lowerOrEqualIndex = firstHigherIndex - 1 < 0 ? 0 : firstHigherIndex - 1
      let (_xs, _ys) = (T.xs(t), T.ys(t))
      let needsInterpolation = _ys[lowerOrEqualIndex] != y
      if needsInterpolation {
        interpolate(
          _ys[lowerOrEqualIndex],
          _ys[firstHigherIndex],
          _xs[lowerOrEqualIndex],
          _xs[firstHigherIndex],
          y,
        )
      } else {
        _xs[lowerOrEqualIndex]
      }
    }
    foundX
  }
}

module XtoY = {
  let stepwiseIncremental = (t: T.t, f) => Pairs.firstAtOrBeforeXValue(t, f)->E.O.fmap(Pairs.y)

  let stepwiseIfAtX = (t: T.t, f: float) =>
    Pairs.getBy(t, ((x: float, _)) => x == f)->E.O.fmap(Pairs.y)

  let linear = (t: T.t, x: float): float => {
    let firstHigherIndex = E.A.Sorted.binarySearchFirstElementGreaterIndex(T.xs(t), x)
    let n = switch firstHigherIndex {
    | #overMax => T.lastY(t)
    | #underMin => T.firstY(t)
    | #firstHigher(firstHigherIndex) =>
      let lowerOrEqualIndex = firstHigherIndex - 1 < 0 ? 0 : firstHigherIndex - 1
      let (_xs, _ys) = (T.xs(t), T.ys(t))
      let needsInterpolation = _xs[lowerOrEqualIndex] != x
      if needsInterpolation {
        interpolate(
          _xs[lowerOrEqualIndex],
          _xs[firstHigherIndex],
          _ys[lowerOrEqualIndex],
          _ys[firstHigherIndex],
          x,
        )
      } else {
        _ys[lowerOrEqualIndex]
      }
    }
    n
  }

  /* Returns a between-points-interpolating function that can be used with PointwiseCombination.combine.
   Interpolation can either be stepwise (using the value on the left) or linear. Extrapolation can be `UseZero or `UseOutermostPoints. */
  let continuousInterpolator = (
    interpolation: interpolationStrategy,
    extrapolation: extrapolationStrategy,
  ): interpolator =>
    switch (interpolation, extrapolation) {
    | (#Linear, #UseZero) =>
      (t: T.t, leftIndex: int, x: float) =>
        if leftIndex < 0 {
          0.0
        } else if leftIndex >= T.length(t) - 1 {
          0.0
        } else {
          let x1 = t.xs[leftIndex]
          let x2 = t.xs[leftIndex + 1]
          let y1 = t.ys[leftIndex]
          let y2 = t.ys[leftIndex + 1]
          let fraction = (x -. x1) /. (x2 -. x1)
          y1 *. (1. -. fraction) +. y2 *. fraction
        }
    | (#Linear, #UseOutermostPoints) =>
      (t: T.t, leftIndex: int, x: float) =>
        if leftIndex < 0 {
          t.ys[0]
        } else if leftIndex >= T.length(t) - 1 {
          t.ys[T.length(t) - 1]
        } else {
          let x1 = t.xs[leftIndex]
          let x2 = t.xs[leftIndex + 1]
          let y1 = t.ys[leftIndex]
          let y2 = t.ys[leftIndex + 1]
          let fraction = (x -. x1) /. (x2 -. x1)
          y1 *. (1. -. fraction) +. y2 *. fraction
        }
    | (#Stepwise, #UseZero) =>
      (t: T.t, leftIndex: int, _x: float) =>
        if leftIndex < 0 {
          0.0
        } else if leftIndex >= T.length(t) - 1 {
          0.0
        } else {
          t.ys[leftIndex]
        }
    | (#Stepwise, #UseOutermostPoints) =>
      (t: T.t, leftIndex: int, _x: float) =>
        if leftIndex < 0 {
          t.ys[0]
        } else if leftIndex >= T.length(t) - 1 {
          t.ys[T.length(t) - 1]
        } else {
          t.ys[leftIndex]
        }
    }

  /* Returns a between-points-interpolating function that can be used with PointwiseCombination.combine.
   For discrete distributions, the probability density between points is zero, so we just return zero here. */
  let discreteInterpolator: interpolator = (_: T.t, _: int, _: float) => 0.0
}

module XsConversion = {
  let _replaceWithXs = (newXs: array<float>, t: T.t): T.t => {
    let newYs = E.A.fmap(newXs, XtoY.linear(t))
    {xs: newXs, ys: newYs}
  }

  let equallyDivideXByMass = (integral: T.t, newLength: int) =>
    E.A.Floats.range(0.0, 1.0, newLength)->E.A.fmap(YtoX.linear(integral))

  let proportionEquallyOverX = (t: T.t, newLength: int): T.t =>
    T.equallyDividedXs(t, newLength)->_replaceWithXs(t)

  let proportionByProbabilityMass = (t: T.t, newLength: int, integral: T.t): T.t =>
    integral->equallyDivideXByMass(newLength)->_replaceWithXs(t) // creates a new set of xs at evenly spaced percentiles // linearly interpolates new ys for the new xs
}

module Zipped = {
  type zipped = array<(float, float)>
  let compareYs = ((_, y1): (float, float), (_, y2): (float, float)) => y1 > y2 ? 1 : 0
  let compareXs = ((x1, _): (float, float), (x2, _): (float, float)) => x1 > x2 ? 1 : 0
  let sortByY = (t: zipped) => t->E.A.stableSortBy(compareYs)
  let sortByX = (t: zipped) => t->E.A.stableSortBy(compareXs)
  let filterByX = (t: zipped, testFn: float => bool) => t->E.A.filter(((x, _)) => testFn(x))
}

module PointwiseCombination = {
  // t1Interpolator and t2Interpolator are functions from XYShape.XtoY, e.g. linearBetweenPointsExtrapolateFlat.
  let combine: (
    interpolator,
    (float, float) => result<float, Operation.Error.t>,
    T.t,
    T.t,
  ) => result<T.t, Operation.Error.t> = %raw(`
      // This function combines two xyShapes by looping through both of them simultaneously.
      // It always moves on to the next smallest x, whether that's in the first or second input's xs,
      // and interpolates the value on the other side, thus accumulating xs and ys.
      // This is written in raw JS because this can still be a bottleneck, and using refs for the i and j indices is quite painful.

      function(interpolator, fn, t1, t2) {
        let t1n = t1.xs.length;
        let t2n = t2.xs.length;
        let outX = [];
        let outY = [];
        let i = -1;
        let j = -1;

        while (i <= t1n - 1 && j <= t2n - 1) {
          let x, ya, yb;
          if (j == t2n - 1 && i < t1n - 1 ||
              t1.xs[i+1] < t2.xs[j+1]) { // if a has to catch up to b, or if b is already done
            i++;

            x = t1.xs[i];
            ya = t1.ys[i];

            yb = interpolator(t2, j, x);
          } else if (i == t1n - 1 && j < t2n - 1 ||
                    t1.xs[i+1] > t2.xs[j+1]) { // if b has to catch up to a, or if a is already done
            j++;

            x = t2.xs[j];
            yb = t2.ys[j];

            ya = interpolator(t1, i, x);
          } else if (i < t1n - 1 && j < t2n && t1.xs[i+1] === t2.xs[j+1]) { // if they happen to be equal, move both ahead
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
            console.log("PointwiseCombination Error", i, j);
          }

          outX.push(x);

          // Here I check whether the operation was a success. If it was
          // keep going. Otherwise, stop and throw the error back to user
          let newY = fn(ya, yb);
          if(newY.TAG === 0){
            outY.push(newY._0);
          }
          else {
            return newY;
          }
        }

        return {TAG: 0, _0: {xs: outX, ys: outY}, [Symbol.for("name")]: "Ok"};
      }
    `)

  /*
    This is from an approach to kl divergence that was ultimately rejected. Leaving it in for now because it may help us factor `combine` out of raw javascript soon.
 */
  let combineAlongSupportOfSecondArgument0: (
    interpolator,
    (float, float) => result<float, Operation.Error.t>,
    T.t,
    T.t,
  ) => result<T.t, Operation.Error.t> = (interpolator, fn, t1, t2) => {
    let newYs = []
    let newXs = []
    let (l1, l2) = (E.A.length(t1.xs), E.A.length(t2.xs))
    let (i, j) = (ref(0), ref(0))
    let minX = t2.xs[0]
    let maxX = t2.xs[l2 - 1]
    while j.contents < l2 - 1 && i.contents < l1 - 1 {
      let someTuple = {
        let x1 = t1.xs[i.contents + 1]
        let x2 = t2.xs[j.contents + 1]
        if (
          /* if t1 has to catch up to t2 */
          i.contents < l1 - 1 && j.contents < l2 && x1 < x2 && minX <= x1 && x2 <= maxX
        ) {
          i := i.contents + 1
          let x = x1
          let y1 = t1.ys[i.contents]
          let y2 = interpolator(t2, j.contents, x)
          Some((x, y1, y2))
        } else if (
          /* if t2 has to catch up to t1 */
          i.contents < l1 && j.contents < l2 - 1 && x1 > x2 && x2 >= minX && maxX >= x1
        ) {
          j := j.contents + 1
          let x = x2
          let y1 = interpolator(t1, i.contents, x)
          let y2 = t2.ys[j.contents]
          Some((x, y1, y2))
        } else if (
          /* move both ahead if they are equal */
          i.contents < l1 - 1 && j.contents < l2 - 1 && x1 == x2 && x1 >= minX && maxX >= x2
        ) {
          i := i.contents + 1
          j := j.contents + 1
          let x = x1
          let y1 = t1.ys[i.contents]
          let y2 = t2.ys[j.contents]
          Some((x, y1, y2))
        } else {
          i := i.contents + 1
          None
        }
      }
      switch someTuple {
      | Some((x, y1, y2)) => {
          let _ = Js.Array.push(fn(y1, y2), newYs)
          let _ = Js.Array.push(x, newXs)
        }

      | None => ()
      }
    }
    T.filterOkYs(newXs, newYs)->Ok
  }

  /* *Dead code*: Nuño wrote this function to try to increase precision, but it didn't work.
     If another traveler comes through with a similar idea, we hope this implementation will help them.
     By "enrich" we mean to increase granularity.
 */
  let enrichXyShape = (t: T.t): T.t => {
    let defaultEnrichmentFactor = 10
    let length = E.A.length(t.xs)
    let points =
      length < MagicNumbers.Environment.defaultXYPointLength
        ? defaultEnrichmentFactor * MagicNumbers.Environment.defaultXYPointLength / length
        : defaultEnrichmentFactor

    let getInBetween = (x1: float, x2: float): array<float> => {
      if abs_float(x1 -. x2) < 2.0 *. MagicNumbers.Epsilon.seven {
        [x1]
      } else {
        let newPointsArray = E.A.makeBy(points - 1, i => i)
        // don't repeat the x2 point, it will be gotten in the next iteration.
        let result = Js.Array.mapi((pos, i) =>
          if i == 0 {
            x1
          } else {
            let points' = Belt.Float.fromInt(points)
            let pos' = Belt.Float.fromInt(pos)
            x1 *. (points' -. pos') /. points' +. x2 *. pos' /. points'
          }
        , newPointsArray)
        result
      }
    }
    let newXsUnflattened = Js.Array.mapi(
      (x, i) => i < length - 2 ? getInBetween(x, t.xs[i + 1]) : [x],
      t.xs,
    )
    let newXs = E.A.concatMany(newXsUnflattened)
    let newYs = E.A.fmap(newXs, x => XtoY.linear(t, x))
    {xs: newXs, ys: newYs}
  }

  let addCombine = (interpolator: interpolator, t1: T.t, t2: T.t): T.t =>
    combine(interpolator, (a, b) => Ok(a +. b), t1, t2)->E.R.toExn(
      "Add operation should never fail",
    )

  let combineEvenXs = (~fn, ~xToYSelection, sampleCount, t1: T.t, t2: T.t) =>
    switch (E.A.length(t1.xs), E.A.length(t2.xs)) {
    | (0, 0) => T.empty
    | (0, _) => t2
    | (_, 0) => t1
    | (_, _) =>
      let allXs = Ts.equallyDividedXs([t1, t2], sampleCount)

      let allYs = allXs->E.A.fmap(x => fn(xToYSelection(x, t1), xToYSelection(x, t2)))

      T.fromArrays(allXs, allYs)
    }

  // TODO: I'd bet this is pretty slow. Maybe it would be faster to intersperse Xs and Ys separately.
  let intersperse = (t1: T.t, t2: T.t) => E.A.intersperse(T.zip(t1), T.zip(t2))->T.fromZippedArray
}

// I'm really not sure this part is actually what we want at this point.
module Range = {
  // ((lastX, lastY), (nextX, nextY))
  type zippedRange = ((float, float), (float, float))

  let toT = T.fromZippedArray
  let nextX = ((_, (nextX, _)): zippedRange) => nextX

  let rangePointAssumingSteps = (((_, lastY), (nextX, _)): zippedRange) => (nextX, lastY)

  let rangeAreaAssumingTriangles = (((lastX, lastY), (nextX, nextY)): zippedRange) =>
    (nextX -. lastX) *. (lastY +. nextY) /. 2.

  //Todo: figure out how to without making new array.
  let rangeAreaAssumingTrapezoids = (((lastX, lastY), (nextX, nextY)): zippedRange) =>
    (nextX -. lastX) *. (Js.Math.min_float(lastY, nextY) +. (lastY +. nextY) /. 2.)

  let delta_y_over_delta_x = (((lastX, lastY), (nextX, nextY)): zippedRange) =>
    (nextY -. lastY) /. (nextX -. lastX)

  let mapYsBasedOnRanges = (t, fn) =>
    E.A.zip(t.xs, t.ys)
    ->E.A.toRanges
    ->E.R.toOption
    ->E.O.fmap(r => r->E.A.fmap(r => (nextX(r), fn(r))))

  // This code is messy, in part because I'm trying to make things easy on garbage collection here.
  // It's using triangles instead of trapezoids right now.
  let integrateWithTriangles = ({xs, ys}) => {
    let length = E.A.length(xs)
    let cumulativeY = Belt.Array.make(length, 0.0)
    for x in 0 to E.A.length(xs) - 2 {
      let _ = Belt.Array.set(
        cumulativeY,
        x + 1,
        (xs[x + 1] -. xs[x]) *. ((ys[x] +. ys[x + 1]) /. 2.) +. cumulativeY[x], // dx // (1/2) * (avgY)
      )
    }
    Some({xs, ys: cumulativeY})
  }

  let derivative = mapYsBasedOnRanges(_, delta_y_over_delta_x)

  let stepwiseToLinear = ({xs, ys}: T.t): T.t => {
    // adds points at the bottom of each step.
    let length = E.A.length(xs)
    let newXs: array<float> = Belt.Array.makeUninitializedUnsafe(2 * length)
    let newYs: array<float> = Belt.Array.makeUninitializedUnsafe(2 * length)

    Belt.Array.set(newXs, 0, xs[0] -. epsilon_float)->ignore
    Belt.Array.set(newYs, 0, 0.)->ignore
    Belt.Array.set(newXs, 1, xs[0])->ignore
    Belt.Array.set(newYs, 1, ys[0])->ignore

    for i in 1 to E.A.length(xs) - 1 {
      Belt.Array.set(newXs, i * 2, xs[i] -. epsilon_float)->ignore
      Belt.Array.set(newYs, i * 2, ys[i - 1])->ignore
      Belt.Array.set(newXs, i * 2 + 1, xs[i])->ignore
      Belt.Array.set(newYs, i * 2 + 1, ys[i])->ignore
      ()
    }

    {xs: newXs, ys: newYs}
  }

  // TODO: I think this isn't needed by any functions anymore.
  let stepsToContinuous = t => {
    // TODO: It would be nicer if this the diff didn't change the first element, and also maybe if there were a more elegant way of doing this.
    let diff = T.xTotalRange(t)->(r => r *. MagicNumbers.Epsilon.five)
    let items = switch E.A.toRanges(E.A.zip(t.xs, t.ys)) {
    | Ok(items) =>
      Some(
        items
        ->E.A.fmap(rangePointAssumingSteps)
        ->T.fromZippedArray
        ->PointwiseCombination.intersperse(t->T.mapX(e => e +. diff), _),
      )
    | _ => Some(t)
    }
    let first = items->E.O.fmap(T.zip)->E.O.bind(E.A.get(_, 0))
    switch (items, first) {
    | (Some(items), Some((0.0, _))) => Some(items)
    | (Some(items), Some((firstX, _))) =>
      let all = E.A.concat([(firstX, 0.0)], items->T.zip)
      all->T.fromZippedArray->E.O.some
    | _ => None
    }
  }
}

module Analysis = {
  let getVarianceDangerously = (t: 't, mean: 't => float, getMeanOfSquares: 't => float): float => {
    let meanSquared = mean(t) ** 2.0
    let meanOfSquares = getMeanOfSquares(t)
    meanOfSquares -. meanSquared
  }
}
