open DistTypes;

module T = {
  type t = xyShape;
  type ts = array(xyShape);

  let toJs = (t: t) => {
    {"xs": t.xs, "ys": t.ys};
  };
  let xs = (t: t) => t.xs;
  let ys = (t: t) => t.ys;
  let minX = (t: t) => t |> xs |> E.A.first;
  let maxX = (t: t) => t |> xs |> E.A.last;
  let minY = (t: t) => t |> ys |> E.A.first;
  let maxY = (t: t) => t |> ys |> E.A.last;
  let xTotalRange = (t: t) =>
    switch (minX(t), maxX(t)) {
    | (Some(min), Some(max)) => Some(max -. min)
    | _ => None
    };
  let first = ({xs, ys}: t) =>
    switch (xs |> E.A.first, ys |> E.A.first) {
    | (Some(x), Some(y)) => Some((x, y))
    | _ => None
    };
  let last = ({xs, ys}: t) =>
    switch (xs |> E.A.last, ys |> E.A.last) {
    | (Some(x), Some(y)) => Some((x, y))
    | _ => None
    };

  let unsafeFirst = (t: t) => first(t) |> E.O.toExn("Unsafe operation");
  let unsafeLast = (t: t) => last(t) |> E.O.toExn("Unsafe operation");

  let zip = ({xs, ys}: t) => Belt.Array.zip(xs, ys);
  let getBy = (t: t, fn) => t |> zip |> Belt.Array.getBy(_, fn);

  let firstPairAtOrBeforeValue = (xValue, t: t) => {
    let zipped = zip(t);
    let firstIndex =
      zipped |> Belt.Array.getIndexBy(_, ((x, y)) => x > xValue);
    let previousIndex =
      switch (firstIndex) {
      | None => Some(Array.length(zipped) - 1)
      | Some(0) => None
      | Some(n) => Some(n - 1)
      };
    previousIndex |> Belt.Option.flatMap(_, Belt.Array.get(zipped));
  };

  let findY = (x: float, t: t): float => {
    let firstHigherIndex =
      E.A.Sorted.binarySearchFirstElementGreaterIndex(xs(t), x);
    let n =
      switch (firstHigherIndex) {
      | `overMax => maxY(t) |> E.O.default(0.0)
      | `underMin => minY(t) |> E.O.default(0.0)
      | `firstHigher(firstHigherIndex) =>
        let lowerOrEqualIndex =
          firstHigherIndex - 1 < 0 ? 0 : firstHigherIndex - 1;
        let needsInterpolation = xs(t)[lowerOrEqualIndex] != x;
        if (needsInterpolation) {
          Functions.interpolate(
            xs(t)[lowerOrEqualIndex],
            xs(t)[firstHigherIndex],
            ys(t)[lowerOrEqualIndex],
            ys(t)[firstHigherIndex],
            x,
          );
        } else {
          ys(t)[lowerOrEqualIndex];
        };
      };
    n;
  };

  let findX = (y: float, t: t): float => {
    let firstHigherIndex =
      E.A.Sorted.binarySearchFirstElementGreaterIndex(ys(t), y);
    let foundX =
      switch (firstHigherIndex) {
      | `overMax => maxX(t) |> E.O.default(0.0)
      | `underMin => minX(t) |> E.O.default(0.0)
      | `firstHigher(firstHigherIndex) =>
        let lowerOrEqualIndex =
          firstHigherIndex - 1 < 0 ? 0 : firstHigherIndex - 1;
        let needsInterpolation = ys(t)[lowerOrEqualIndex] != y;
        if (needsInterpolation) {
          Functions.interpolate(
            ys(t)[lowerOrEqualIndex],
            ys(t)[firstHigherIndex],
            xs(t)[lowerOrEqualIndex],
            xs(t)[firstHigherIndex],
            y,
          );
        } else {
          xs(t)[lowerOrEqualIndex];
        };
      };
    foundX;
  };

  let convertWithAlternativeXs = (newXs: array(float), t: t): t => {
    let newYs = Belt.Array.map(newXs, f => findY(f, t));
    {xs: newXs, ys: newYs};
  };

  let convertToNewLength = (newLength: int, t: t): DistTypes.xyShape => {
    Functions.(
      range(min(xs(t)), max(xs(t)), newLength)
      |> convertWithAlternativeXs(_, t)
    );
  };

  module XtoY = {
    let stepwiseIncremental = (f, t: t) =>
      firstPairAtOrBeforeValue(f, t) |> E.O.fmap(((_, y)) => y);

    let stepwiseIfAtX = (f: float, t: t) => {
      getBy(t, ((x: float, _)) => {x == f}) |> E.O.fmap(((_, y)) => y);
    };

    // TODO: When Roman's PR comes in, fix this bit. This depends on interpolation, obviously.
    let linear = (f, t: t) => t |> findY(f);
  };

  let pointwiseMap = (fn, t: t): t => {xs: t.xs, ys: t.ys |> E.A.fmap(fn)};
  let xMap = (fn, t: t): t => {xs: E.A.fmap(fn, t.xs), ys: t.ys};
  let fromArray = ((xs, ys)): t => {xs, ys};
  let fromArrays = (xs, ys): t => {xs, ys};
  let fromZippedArray = (is: array((float, float))): t =>
    is |> Belt.Array.unzip |> fromArray;

  module Zipped = {
    type zipped = array((float, float));
    let sortByY = (t: zipped) =>
      t |> E.A.stableSortBy(_, ((_, y1), (_, y2)) => y1 > y2 ? 1 : 0);
    let sortByX = (t: zipped) =>
      t |> E.A.stableSortBy(_, ((x1, _), (x2, _)) => x1 > x2 ? 1 : 0);
  };

  module Combine = {
    let combineLinear = (t1: t, t2: t, fn: (float, float) => float) => {
      let allXs = Belt.Array.concat(xs(t1), xs(t2));
      allXs |> Array.sort(compare);
      let allYs =
        allXs
        |> E.A.fmap(x => {
             let y1 = XtoY.linear(x, t1);
             let y2 = XtoY.linear(x, t2);
             fn(y1, y2);
           });
      fromArrays(allXs, allYs);
    };

    let combineStepwise =
        (t1: t, t2: t, fn: (option(float), option(float)) => float) => {
      let allXs = Belt.Array.concat(xs(t1), xs(t2));
      allXs |> Array.sort(compare);
      let allYs =
        allXs
        |> E.A.fmap(x => {
             let y1 = XtoY.stepwiseIncremental(x, t1);
             let y2 = XtoY.stepwiseIncremental(x, t2);
             fn(y1, y2);
           });
      fromArrays(allXs, allYs);
    };

    let combineIfAtX =
        (t1: t, t2: t, fn: (option(float), option(float)) => float) => {
      let allXs = Belt.Array.concat(xs(t1), xs(t2));
      allXs |> Array.sort(compare);
      let allYs =
        allXs
        |> E.A.fmap(x => {
             let y1 = XtoY.stepwiseIfAtX(x, t1);
             let y2 = XtoY.stepwiseIfAtX(x, t2);
             fn(y1, y2);
           });
      fromArrays(allXs, allYs);
    };
  };

  // todo: maybe not needed?
  // let comparePoint = (a: float, b: float) => a > b ? 1 : (-1);

  let comparePoints = ((x1: float, y1: float), (x2: float, y2: float)) =>
    switch (x1 == x2, y1 == y2) {
    | (false, _) => compare(x1, x2)
    | (true, false) => compare(y1, y2)
    | (true, true) => (-1)
    };

  // todo: This is broken :(
  let combine = (t1: t, t2: t) => {
    let array = Belt.Array.concat(zip(t1), zip(t2));
    Array.sort(comparePoints, array);
    array |> Belt.Array.unzip |> fromArray;
  };

  let intersperce = (t1: t, t2: t) => {
    let items: ref(array((float, float))) = ref([||]);
    let t1 = zip(t1);
    let t2 = zip(t2);

    Belt.Array.forEachWithIndex(t1, (i, item) => {
      switch (Belt.Array.get(t2, i)) {
      | Some(r) => items := E.A.append(items^, [|item, r|])
      | None => items := E.A.append(items^, [|item|])
      }
    });
    items^ |> Belt.Array.unzip |> fromArray;
  };

  let yFold = (fn, t: t) => {
    E.A.fold_left(fn, 0., t.ys);
  };

  let ySum = yFold((a, b) => a +. b);

  let _transverseSimple = fn =>
    Belt.Array.reduce(_, [||], (items, y) =>
      switch (E.A.last(items)) {
      | Some(yLast) => Belt.Array.concat(items, [|fn(y, yLast)|])
      | None => [|y|]
      }
    );

  let _transverse2 = (fn, items) => {
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

  let _transverseB = (fn, items) => {
    let (xs, ys) = items |> Belt.Array.unzip;
    let newYs = _transverse2(fn, ys);
    Belt.Array.zip(xs, newYs);
  };

  let _transverse = fn =>
    Belt.Array.reduce(_, [||], (items, (x, y)) =>
      switch (E.A.last(items)) {
      | Some((_, yLast)) =>
        Belt.Array.concat(items, [|(x, fn(y, yLast))|])
      | None => [|(x, y)|]
      }
    );

  let _transverseShape2 = (fn, p: t) => {
    Belt.Array.zip(p.xs, p.ys)
    |> _transverseB(fn)
    |> Belt.Array.unzip
    |> fromArray;
  };

  let _transverseShape = (fn, p: t) => {
    fromArray((p.xs, _transverse2(fn, p.ys)));
  };

  let filter = (fn, t: t) =>
    t |> zip |> E.A.filter(fn) |> Belt.Array.unzip |> fromArray;

  let accumulateYs = _transverseShape((aCurrent, aLast) => aCurrent +. aLast);
  let subtractYs = _transverseShape((aCurrent, aLast) => aCurrent -. aLast);
};

// I'm really not sure this part is actually what we want at this point.
module Range = {
  // ((lastX, lastY), (nextX, nextY))
  type zippedRange = ((float, float), (float, float));

  let floatSum = Belt.Array.reduce(_, 0., (a, b) => a +. b);
  let toT = r => r |> Belt.Array.unzip |> T.fromArray;
  let nextX = ((_, (nextX, _)): zippedRange) => nextX;

  let rangePointAssumingSteps =
      (((lastX, lastY), (nextX, nextY)): zippedRange) => (
    nextX,
    lastY,
  );

  let rangeAreaAssumingTriangles =
      (((lastX, lastY), (nextX, nextY)): zippedRange) =>
    (nextX -. lastX) *. (lastY +. nextY) /. 2.;

  let delta_y_over_delta_x =
      (((lastX, lastY), (nextX, nextY)): zippedRange) =>
    (nextY -. lastY) /. (nextX -. lastX);

  let mapYsBasedOnRanges = (fn, t) =>
    Belt.Array.zip(t.xs, t.ys)
    |> E.A.toRanges
    |> E.R.toOption
    |> E.O.fmap(r => r |> Belt.Array.map(_, r => (nextX(r), fn(r))));

  let integrateWithTriangles = z => {
    let rangeItems = mapYsBasedOnRanges(rangeAreaAssumingTriangles, z);
    (
      switch (rangeItems, z |> T.first) {
      | (Some(r), Some((firstX, _))) =>
        Some(Belt.Array.concat([|(firstX, 0.0)|], r))
      | _ => None
      }
    )
    |> E.O.fmap(toT)
    |> E.O.fmap(T.accumulateYs);
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
          |> Belt.Array.unzip
          |> T.fromArray
          |> T.intersperce(t |> T.xMap(e => e +. diff)),
        )
      | _ => Some(t)
      };
    let bar = items |> E.O.fmap(T.zip) |> E.O.bind(_, E.A.get(_, 0));
    let items =
      switch (items, bar) {
      | (Some(items), Some((0.0, _))) => Some(items)
      | (Some(items), Some((firstX, _))) =>
        let all = E.A.append([|(firstX, 0.0)|], items |> T.zip);
        let foo = all |> Belt.Array.unzip |> T.fromArray;
        Some(foo);
      | _ => None
      };
    items;
  };
};

module Ts = {
  type t = T.ts;
  let minX = (t: t) =>
    t |> E.A.fmap(T.minX) |> E.A.O.concatSomes |> Functions.min;
  let maxX = (t: t) =>
    t |> E.A.fmap(T.maxX) |> E.A.O.concatSomes |> Functions.max;

  // TODO/Warning: This will break if the shapes are empty.
  let equallyDividedXs = (t: t, newLength) => {
    Functions.range(minX(t), maxX(t), newLength);
  };
};

let combinePointwise = (fn, sampleCount, t1: xyShape, t2: xyShape) => {
  let xs = Ts.equallyDividedXs([|t1, t2|], sampleCount);
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
  |> E.O.bind(_, T.last)
  |> E.O.fmap(((_, y)) => y);