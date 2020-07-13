open DistTypes;

let interpolate =
    (xMin: float, xMax: float, yMin: float, yMax: float, xIntended: float)
    : float => {
  let minProportion = (xMax -. xIntended) /. (xMax -. xMin);
  let maxProportion = (xIntended -. xMin) /. (xMax -. xMin);
  yMin *. minProportion +. yMax *. maxProportion;
};

// TODO: Make sure that shapes cannot be empty.
let extImp = E.O.toExt("Tried to perform an operation on an empty XYShape.");

module T = {
  type t = xyShape;
  let toXyShape = (t: t): xyShape => t;
  type ts = array(xyShape);
  let xs = (t: t) => t.xs;
  let ys = (t: t) => t.ys;
  let length = (t: t) => E.A.length(t.xs);
  let empty = {xs: [||], ys: [||]};
  let minX = (t: t) => t |> xs |> E.A.Sorted.min |> extImp;
  let maxX = (t: t) => t |> xs |> E.A.Sorted.max |> extImp;
  let firstY = (t: t) => t |> ys |> E.A.first |> extImp;
  let lastY = (t: t) => t |> ys |> E.A.last |> extImp;
  let xTotalRange = (t: t) => maxX(t) -. minX(t);
  let mapX = (fn, t: t): t => {xs: E.A.fmap(fn, t.xs), ys: t.ys};
  let mapY = (fn, t: t): t => {xs: t.xs, ys: E.A.fmap(fn, t.ys)};
  let zip = ({xs, ys}: t) => Belt.Array.zip(xs, ys);
  let fromArray = ((xs, ys)): t => {xs, ys};
  let fromArrays = (xs, ys): t => {xs, ys};
  let accumulateYs = (fn, p: t) => {
    fromArray((p.xs, E.A.accumulate(fn, p.ys)));
  };
  let fromZippedArray = (pairs: array((float, float))): t =>
    pairs |> Belt.Array.unzip |> fromArray;
  let equallyDividedXs = (t: t, newLength) => {
    E.A.Floats.range(minX(t), maxX(t), newLength);
  };
  let toJs = (t: t) => {
    {"xs": t.xs, "ys": t.ys};
  };
};

module Ts = {
  type t = T.ts;
  let minX = (t: t) => t |> E.A.fmap(T.minX) |> E.A.min |> extImp;
  let maxX = (t: t) => t |> E.A.fmap(T.maxX) |> E.A.max |> extImp;
  let equallyDividedXs = (t: t, newLength) => {
    E.A.Floats.range(minX(t), maxX(t), newLength);
  };
  let allXs = (t: t) => t |> E.A.fmap(T.xs) |> E.A.Sorted.concatMany;
};

module Pairs = {
  let x = fst;
  let y = snd;
  let first = (t: T.t) => (T.minX(t), T.firstY(t));
  let last = (t: T.t) => (T.maxX(t), T.lastY(t));

  let getBy = (t: T.t, fn) => t |> T.zip |> E.A.getBy(_, fn);

  let firstAtOrBeforeXValue = (xValue, t: T.t) => {
    let zipped = T.zip(t);
    let firstIndex =
      zipped |> Belt.Array.getIndexBy(_, ((x, _)) => x > xValue);
    let previousIndex =
      switch (firstIndex) {
      | None => Some(Array.length(zipped) - 1)
      | Some(0) => None
      | Some(n) => Some(n - 1)
      };
    previousIndex |> Belt.Option.flatMap(_, Belt.Array.get(zipped));
  };
};

module YtoX = {
  let linear = (y: float, t: T.t): float => {
    let firstHigherIndex =
      E.A.Sorted.binarySearchFirstElementGreaterIndex(T.ys(t), y);
    let foundX =
      switch (firstHigherIndex) {
      | `overMax => T.maxX(t)
      | `underMin => T.minX(t)
      | `firstHigher(firstHigherIndex) =>
        let lowerOrEqualIndex =
          firstHigherIndex - 1 < 0 ? 0 : firstHigherIndex - 1;
        let (_xs, _ys) = (T.xs(t), T.ys(t));
        let needsInterpolation = _ys[lowerOrEqualIndex] != y;
        if (needsInterpolation) {
          interpolate(
            _ys[lowerOrEqualIndex],
            _ys[firstHigherIndex],
            _xs[lowerOrEqualIndex],
            _xs[firstHigherIndex],
            y,
          );
        } else {
          _xs[lowerOrEqualIndex];
        };
      };
    foundX;
  };
};

module XtoY = {
  let stepwiseIncremental = (f, t: T.t) =>
    Pairs.firstAtOrBeforeXValue(f, t) |> E.O.fmap(Pairs.y);

  let stepwiseIfAtX = (f: float, t: T.t) => {
    Pairs.getBy(t, ((x: float, _)) => {x == f}) |> E.O.fmap(Pairs.y);
  };

  let linear = (x: float, t: T.t): float => {
    let firstHigherIndex =
      E.A.Sorted.binarySearchFirstElementGreaterIndex(T.xs(t), x);
    let n =
      switch (firstHigherIndex) {
      | `overMax => T.lastY(t)
      | `underMin => T.firstY(t)
      | `firstHigher(firstHigherIndex) =>
        let lowerOrEqualIndex =
          firstHigherIndex - 1 < 0 ? 0 : firstHigherIndex - 1;
        let (_xs, _ys) = (T.xs(t), T.ys(t));
        let needsInterpolation = _xs[lowerOrEqualIndex] != x;
        if (needsInterpolation) {
          interpolate(
            _xs[lowerOrEqualIndex],
            _xs[firstHigherIndex],
            _ys[lowerOrEqualIndex],
            _ys[firstHigherIndex],
            x,
          );
        } else {
          _ys[lowerOrEqualIndex];
        };
      };
    n;
  };
};

module XsConversion = {
  let _replaceWithXs = (newXs: array(float), t: T.t): T.t => {
    let newYs = Belt.Array.map(newXs, XtoY.linear(_, t));
    {xs: newXs, ys: newYs};
  };

  let equallyDivideXByMass = (newLength: int, integral: T.t) =>
    E.A.Floats.range(0.0, 1.0, newLength)
    |> E.A.fmap(YtoX.linear(_, integral));

  let proportionEquallyOverX = (newLength: int, t: T.t): T.t => {
    T.equallyDividedXs(t, newLength) |> _replaceWithXs(_, t);
  };

  let proportionByProbabilityMass =
      (newLength: int, integral: T.t, t: T.t): T.t => {
    integral
    |> equallyDivideXByMass(newLength) // creates a new set of xs at evenly spaced percentiles
    |> _replaceWithXs(_, t); // linearly interpolates new ys for the new xs
  };
};

module Zipped = {
  type zipped = array((float, float));
  let compareYs = ((_, y1), (_, y2)) => y1 > y2 ? 1 : 0;
  let compareXs = ((x1, _), (x2, _)) => x1 > x2 ? 1 : 0;
  let sortByY = (t: zipped) => t |> E.A.stableSortBy(_, compareYs);
  let sortByX = (t: zipped) => t |> E.A.stableSortBy(_, compareXs);
  let filterByX = (testFn: (float => bool), t: zipped) => t |> E.A.filter(((x, _)) => testFn(x));
};

module PointwiseCombination = {
  type xsSelection =
    | ALL_XS
    | XS_EVENLY_DIVIDED(int);

  let combineLinear = [%raw {| // : (float => float => float, T.t, T.t) => T.t
      // This function combines two xyShapes by looping through both of them simultaneously.
      // It always moves on to the next smallest x, whether that's in the first or second input's xs,
      // and interpolates the value on the other side, thus accumulating xs and ys.
      // In this implementation (unlike in XtoY.linear above), values outside of a shape's xs are considered 0.0 (instead of firstY or lastY).
      // This is written in raw JS because this can still be a bottleneck, and using refs for the i and j indices is quite painful.

      function(fn, t1, t2) {
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

            let bFraction = (x - (t2.xs[j] || x)) / ((t2.xs[j+1] || x) - (t2.xs[j] || 0));
            yb = (t2.ys[j] || 0) * (1-bFraction) + (t2.ys[j+1] || 0) * bFraction;
          } else if (i == t1n - 1 && j < t2n - 1 ||
                    t1.xs[i+1] > t2.xs[j+1]) { // if b has to catch up to a, or if a is already done
            j++;

            x = t2.xs[j];
            yb = t2.ys[j];

            let aFraction = (x - (t1.xs[i] || x)) / ((t1.xs[i+1] || x) - (t1.xs[i] || 0));
            ya = (t1.ys[i] || 0) * (1-aFraction) + (t1.ys[i+1] || 0) * aFraction;
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
            console.log("Error!", i, j);
          }

          outX.push(x);
          outY.push(fn(ya, yb));
        }
        return {xs: outX, ys: outY};
      }
    |}];

  let combine =
      (
        ~xToYSelection: (float, T.t) => 'a,
        ~xsSelection=ALL_XS,
        ~fn,
        t1: T.t,
        t2: T.t,
      ) => {

    switch ((E.A.length(t1.xs), E.A.length(t2.xs))) {
    | (0, 0) => T.empty
    | (0, _) => t2
    | (_, 0) => t1
    | (_, _) => {
        let allXs =
          switch (xsSelection) {
          | ALL_XS => Ts.allXs([|t1, t2|])
          | XS_EVENLY_DIVIDED(sampleCount) =>
            Ts.equallyDividedXs([|t1, t2|], sampleCount)
          };

        let allYs =
          allXs |> E.A.fmap(x => fn(xToYSelection(x, t1), xToYSelection(x, t2)));

        T.fromArrays(allXs, allYs);
      }
    }
  };

  let combineStepwise = combine(~xToYSelection=XtoY.stepwiseIncremental);
  let combineIfAtX = combine(~xToYSelection=XtoY.stepwiseIfAtX);

  // TODO: I'd bet this is pretty slow. Maybe it would be faster to intersperse Xs and Ys separately.
  let intersperse = (t1: T.t, t2: T.t) => {
    E.A.intersperse(T.zip(t1), T.zip(t2)) |> T.fromZippedArray;
  };
};

// I'm really not sure this part is actually what we want at this point.
module Range = {
  // ((lastX, lastY), (nextX, nextY))
  type zippedRange = ((float, float), (float, float));

  let toT = T.fromZippedArray;
  let nextX = ((_, (nextX, _)): zippedRange) => nextX;

  let rangePointAssumingSteps = (((_, lastY), (nextX, _)): zippedRange) => (
    nextX,
    lastY,
  );

  let rangeAreaAssumingTriangles =
      (((lastX, lastY), (nextX, nextY)): zippedRange) =>
    (nextX -. lastX) *. (lastY +. nextY) /. 2.;

  //Todo: figure out how to without making new array.
  let rangeAreaAssumingTrapezoids =
      (((lastX, lastY), (nextX, nextY)): zippedRange) =>
    (nextX -. lastX)
    *. (Js.Math.min_float(lastY, nextY) +. (lastY +. nextY) /. 2.);

  let delta_y_over_delta_x =
      (((lastX, lastY), (nextX, nextY)): zippedRange) =>
    (nextY -. lastY) /. (nextX -. lastX);

  let mapYsBasedOnRanges = (fn, t) =>
    Belt.Array.zip(t.xs, t.ys)
    |> E.A.toRanges
    |> E.R.toOption
    |> E.O.fmap(r => r |> Belt.Array.map(_, r => (nextX(r), fn(r))));

  // This code is messy, in part because I'm trying to make things easy on garbage collection here.
  // It's using triangles instead of trapezoids right now.
  let integrateWithTriangles = ({xs, ys}) => {
    let length = E.A.length(xs);
    let cumulativeY = Belt.Array.make(length, 0.0);
    for (x in 0 to E.A.length(xs) - 2) {
      let _ =
        Belt.Array.set(
          cumulativeY,
          x + 1,
          (xs[x + 1] -. xs[x])  // dx
          *. ((ys[x] +. ys[x + 1]) /. 2.) // (1/2) * (avgY)
          +. cumulativeY[x],
        );
      ();
    };
    Some({xs, ys: cumulativeY});
  };

  let derivative = mapYsBasedOnRanges(delta_y_over_delta_x);

  // TODO: It would be nicer if this the diff didn't change the first element, and also maybe if there were a more elegant way of doing this.
  let stepsToContinuous = t => {
    let diff = T.xTotalRange(t) |> (r => r *. 0.00001);
    let items =
      switch (E.A.toRanges(Belt.Array.zip(t.xs, t.ys))) {
      | Ok(items) =>
        Some(
          items
          |> Belt.Array.map(_, rangePointAssumingSteps)
          |> T.fromZippedArray
          |> PointwiseCombination.intersperse(t |> T.mapX(e => e +. diff)),
        )
      | _ => Some(t)
      };
    let first = items |> E.O.fmap(T.zip) |> E.O.bind(_, E.A.get(_, 0));
    switch (items, first) {
    | (Some(items), Some((0.0, _))) => Some(items)
    | (Some(items), Some((firstX, _))) =>
      let all = E.A.append([|(firstX, 0.0)|], items |> T.zip);
      all |> T.fromZippedArray |> E.O.some;
    | _ => None
    };
  };
};

let pointLogScore = (prediction, answer) =>
  switch (answer) {
  | 0. => 0.0
  | answer => answer *. Js.Math.log2(Js.Math.abs_float(prediction /. answer))
  };

let logScorePoint = (sampleCount, t1, t2) =>
  PointwiseCombination.combine(
    ~xsSelection=XS_EVENLY_DIVIDED(sampleCount),
    ~xToYSelection=XtoY.linear,
    ~fn=pointLogScore,
    t1,
    t2,
  )
  |> Range.integrateWithTriangles
  |> E.O.fmap(T.accumulateYs((+.)))
  |> E.O.fmap(Pairs.last)
  |> E.O.fmap(Pairs.y);

module Analysis = {
  let integrateContinuousShape =
      (
        ~indefiniteIntegralStepwise=(p, h1) => h1 *. p,
        ~indefiniteIntegralLinear=(p, a, b) => a *. p +. b *. p ** 2.0 /. 2.0,
        t: DistTypes.continuousShape,
      )
      : float => {
    let xs = t.xyShape.xs;
    let ys = t.xyShape.ys;

    E.A.reducei(
      xs,
      0.0,
      (acc, _x, i) => {
        let areaUnderIntegral =
          // TODO Take this switch statement out of the loop body
          switch (t.interpolation, i) {
          | (_, 0) => 0.0
          | (`Stepwise, _) =>
            indefiniteIntegralStepwise(xs[i], ys[i - 1])
            -. indefiniteIntegralStepwise(xs[i - 1], ys[i - 1])
          | (`Linear, _) =>
            let x1 = xs[i - 1];
            let x2 = xs[i];
            if (x1 == x2) {
              0.0
            } else {
              let h1 = ys[i - 1];
              let h2 = ys[i];
              let b = (h1 -. h2) /. (x1 -. x2);
              let a = h1 -. b *. x1;
              indefiniteIntegralLinear(x2, a, b)
              -. indefiniteIntegralLinear(x1, a, b);
            };
          };
        acc +. areaUnderIntegral;
      },
    );
  };

  let getMeanOfSquaresContinuousShape = (t: DistTypes.continuousShape) => {
    let indefiniteIntegralLinear = (p, a, b) =>
      a *. p ** 3.0 /. 3.0 +. b *. p ** 4.0 /. 4.0;
    let indefiniteIntegralStepwise = (p, h1) => h1 *. p ** 3.0 /. 3.0;
    integrateContinuousShape(
      ~indefiniteIntegralStepwise,
      ~indefiniteIntegralLinear,
      t,
    );
  };

  let getVarianceDangerously =
      (t: 't, mean: 't => float, getMeanOfSquares: 't => float): float => {
    let meanSquared = mean(t) ** 2.0;
    let meanOfSquares = getMeanOfSquares(t);
    meanOfSquares -. meanSquared;
  };

  let squareXYShape = T.mapX(x => x ** 2.0)
};
