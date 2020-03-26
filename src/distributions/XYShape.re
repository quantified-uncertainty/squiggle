open DistTypes;

let interpolate =
    (xMin: float, xMax: float, yMin: float, yMax: float, xIntended: float)
    : float => {
  let minProportion = (xMax -. xIntended) /. (xMax -. xMin);
  let maxProportion = (xIntended -. xMin) /. (xMax -. xMin);
  yMin *. minProportion +. yMax *. maxProportion;
};

module T = {
  type t = xyShape;
  type ts = array(xyShape);

  let toJs = (t: t) => {
    {"xs": t.xs, "ys": t.ys};
  };
  let xs = (t: t) => t.xs;
  let ys = (t: t) => t.ys;
  let minX = (t: t) => t |> xs |> E.A.Sorted.min;
  let maxX = (t: t) => t |> xs |> E.A.Sorted.max;
  let minY = (t: t) => t |> ys |> E.A.Sorted.min;
  let maxY = (t: t) => t |> ys |> E.A.Sorted.max;
  let xTotalRange = (t: t) => t |> xs |> E.A.Sorted.range;
  let zip = ({xs, ys}: t) => Belt.Array.zip(xs, ys);
  let pointwiseMap = (fn, t: t): t => {xs: t.xs, ys: t.ys |> E.A.fmap(fn)};
  let xMap = (fn, t: t): t => {xs: E.A.fmap(fn, t.xs), ys: t.ys};
  let fromArray = ((xs, ys)): t => {xs, ys};
  let fromArrays = (xs, ys): t => {xs, ys};
  let fromZippedArray = (is: array((float, float))): t =>
    is |> Belt.Array.unzip |> fromArray;
  let equallyDividedXs = (t: t, newLength) => {
    E.A.Floats.range(
      minX(t) |> E.O.toExt("Unsafe"),
      maxX(t) |> E.O.toExt("Unsafe"),
      newLength,
    );
  };

  module Ts = {
    type t = ts;
    let minX = (t: t) =>
      t
      |> E.A.fmap(minX)
      |> E.A.O.concatSomes
      |> E.A.min
      |> E.O.toExt("Unsafe");
    let maxX = (t: t) =>
      t
      |> E.A.fmap(maxX)
      |> E.A.O.concatSomes
      |> E.A.max
      |> E.O.toExt("Unsafe");
    let equallyDividedXs = (t: t, newLength) => {
      E.A.Floats.range(minX(t), maxX(t), newLength);
    };
  };

  module Pairs = {
    let first = (t: t) =>
      switch (minX(t), minY(t)) {
      | (Some(x), Some(y)) => Some((x, y))
      | _ => None
      };
    let last = (t: t) =>
      switch (maxX(t), maxY(t)) {
      | (Some(x), Some(y)) => Some((x, y))
      | _ => None
      };
    let unsafeFirst = (t: t) => first(t) |> E.O.toExn("Unsafe operation");
    let unsafeLast = (t: t) => last(t) |> E.O.toExn("Unsafe operation");

    let getBy = (t: t, fn) => t |> zip |> Belt.Array.getBy(_, fn);

    let firstAtOrBeforeXValue = (xValue, t: t) => {
      let zipped = zip(t);
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
    let linear = (y: float, t: t): float => {
      let firstHigherIndex =
        E.A.Sorted.binarySearchFirstElementGreaterIndex(ys(t), y);
      let foundX =
        switch (firstHigherIndex) {
        | `overMax => maxX(t) |> E.O.default(0.0)
        | `underMin => minX(t) |> E.O.default(0.0)
        | `firstHigher(firstHigherIndex) =>
          let lowerOrEqualIndex =
            firstHigherIndex - 1 < 0 ? 0 : firstHigherIndex - 1;
          let (_xs, _ys) = (xs(t), ys(t));
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
    let stepwiseIncremental = (f, t: t) =>
      Pairs.firstAtOrBeforeXValue(f, t) |> E.O.fmap(((_, y)) => y);

    let stepwiseIfAtX = (f: float, t: t) => {
      Pairs.getBy(t, ((x: float, _)) => {x == f})
      |> E.O.fmap(((_, y)) => y);
    };

    let linear = (x: float, t: t): float => {
      let firstHigherIndex =
        E.A.Sorted.binarySearchFirstElementGreaterIndex(xs(t), x);
      let n =
        switch (firstHigherIndex) {
        | `overMax => maxY(t) |> E.O.default(0.0)
        | `underMin => minY(t) |> E.O.default(0.0)
        | `firstHigher(firstHigherIndex) =>
          let lowerOrEqualIndex =
            firstHigherIndex - 1 < 0 ? 0 : firstHigherIndex - 1;
          let (_xs, _ys) = (xs(t), ys(t));
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
    let replaceWithXs = (newXs: array(float), t: t): t => {
      let newYs = Belt.Array.map(newXs, f => XtoY.linear(f, t));
      {xs: newXs, ys: newYs};
    };

    let proportionEquallyOverX = (newLength: int, t: t): t => {
      equallyDividedXs(t, newLength) |> replaceWithXs(_, t);
    };

    let proportionByProbabilityMass = (newLength: int, integral: t, t: t): t => {
      E.A.Floats.range(0.0, 1.0, newLength)
      |> E.A.fmap(YtoX.linear(_, integral))
      |> replaceWithXs(_, t);
    };
  };

  module Zipped = {
    type zipped = array((float, float));
    let sortByY = (t: zipped) =>
      t |> E.A.stableSortBy(_, ((_, y1), (_, y2)) => y1 > y2 ? 1 : 0);
    let sortByX = (t: zipped) =>
      t |> E.A.stableSortBy(_, ((x1, _), (x2, _)) => x1 > x2 ? 1 : 0);
  };

  module Combine = {
    let _allXs = (t1: t, t2: t) => E.A.Sorted.concat(xs(t1), xs(t2));

    let _combineAbstract = (comboAlg, t1: t, t2: t, fn) => {
      let allXs = _allXs(t1, t2);
      let allYs =
        allXs
        |> E.A.fmap(x => {
             let y1 = comboAlg(x, t1);
             let y2 = comboAlg(x, t2);
             fn(y1, y2);
           });
      fromArrays(allXs, allYs);
    };

    let combineLinear = _combineAbstract(XtoY.linear);
    let combineStepwise = _combineAbstract(XtoY.stepwiseIncremental);
    let combineIfAtX = _combineAbstract(XtoY.stepwiseIfAtX);

    // TODO: I'd bet this is pretty slow
    let intersperse = (t1: t, t2: t) => {
      E.A.intersperse(zip(t1), zip(t2)) |> fromZippedArray;
    };
  };

  module Transversal = {
    let _transverse = (fn, items) => {
      let length = items |> E.A.length;
      let empty = Belt.Array.make(length, items |> E.A.unsafe_get(_, 0));
      Belt.Array.forEachWithIndex(
        items,
        (index, element) => {
          let item =
            switch (index) {
            | 0 => element
            | index => fn(element, E.A.unsafe_get(empty, index - 1))
            };
          let _ = Belt.Array.set(empty, index, item);
          ();
        },
      );
      empty;
    };

    let _transverseShape = (fn, p: t) => {
      fromArray((p.xs, _transverse(fn, p.ys)));
    };
  };

  let accumulateYs =
    Transversal._transverseShape((aCurrent, aLast) => aCurrent +. aLast);
};

// I'm really not sure this part is actually what we want at this point.
module Range = {
  // ((lastX, lastY), (nextX, nextY))
  type zippedRange = ((float, float), (float, float));

  let floatSum = Belt.Array.reduce(_, 0., (a, b) => a +. b);
  let toT = T.fromZippedArray;
  let nextX = ((_, (nextX, _)): zippedRange) => nextX;

  let rangePointAssumingSteps =
      (((lastX, lastY), (nextX, nextY)): zippedRange) => (
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
    //TODO: I don't think this next line is needed, but definitely check.
    let _ = Belt.Array.set(cumulativeY, 0, 0.0);
    for (x in 0 to E.A.length(xs) - 2) {
      Belt.Array.set(
        cumulativeY,
        x + 1,
        (xs[x + 1] -. xs[x]) *. ((ys[x] +. ys[x + 1]) /. 2.) +. cumulativeY[x],
      );
      ();
    };
    Some({xs, ys: cumulativeY});
  };

  let derivative = mapYsBasedOnRanges(delta_y_over_delta_x);

  // TODO: It would be nicer if this the diff didn't change the first element, and also maybe if there were a more elegant way of doing this.
  let stepsToContinuous = t => {
    let diff = T.xTotalRange(t) |> E.O.fmap(r => r *. 0.00001);
    let items =
      switch (diff, E.A.toRanges(Belt.Array.zip(t.xs, t.ys))) {
      | (Some(diff), Ok(items)) =>
        Some(
          items
          |> Belt.Array.map(_, rangePointAssumingSteps)
          |> T.fromZippedArray
          |> T.Combine.intersperse(t |> T.xMap(e => e +. diff)),
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

let combinePointwise = (fn, sampleCount, t1: xyShape, t2: xyShape) => {
  let xs = T.Ts.equallyDividedXs([|t1, t2|], sampleCount);
  let ys =
    xs |> E.A.fmap(x => fn(T.XtoY.linear(x, t1), T.XtoY.linear(x, t2)));
  T.fromArrays(xs, ys);
};

let logScoreDist =
  combinePointwise((prediction, answer) =>
    switch (answer) {
    | 0. => 0.0
    | answer =>
      answer *. Js.Math.log2(Js.Math.abs_float(prediction /. answer))
    }
  );

let logScorePoint = (sampleCount, t1, t2) =>
  logScoreDist(sampleCount, t1, t2)
  |> Range.integrateWithTriangles
  |> E.O.fmap(T.accumulateYs)
  |> E.O.bind(_, T.Pairs.last)
  |> E.O.fmap(((_, y)) => y);