open DistTypes;

type t = xyShape;

let toJs = (t: t) => {
  {"xs": t.xs, "ys": t.ys};
};
let minX = (t: t) => t.xs |> E.A.first;
let maxX = (t: t) => t.xs |> E.A.last;
let first = (t: t) =>
  switch (t.xs |> E.A.first, t.ys |> E.A.first) {
  | (Some(x), Some(y)) => Some((x, y))
  | _ => None
  };
let last = (t: t) =>
  switch (t.xs |> E.A.last, t.ys |> E.A.last) {
  | (Some(x), Some(y)) => Some((x, y))
  | _ => None
  };

let zip = t => Belt.Array.zip(t.xs, t.ys);
let getBy = (t: t, fn) => t |> zip |> Belt.Array.getBy(_, fn);
let pointwiseMap = (fn, t: t): t => {xs: t.xs, ys: t.ys |> E.A.fmap(fn)};
let fromArray = ((xs, ys)): t => {xs, ys};
let fromArrays = (xs, ys): t => {xs, ys};

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
  let totalLength = E.A.length(t1.xs) + E.A.length(t2.xs);
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

let _transverse = fn =>
  Belt.Array.reduce(_, [||], (items, (x, y)) =>
    switch (E.A.last(items)) {
    | Some((_, yLast)) => Belt.Array.concat(items, [|(x, fn(y, yLast))|])
    | None => [|(x, y)|]
    }
  );

let _transverseShape = (fn, p: t) => {
  Belt.Array.zip(p.xs, p.ys)
  |> _transverse(fn)
  |> Belt.Array.unzip
  |> fromArray;
};

let accumulateYs = _transverseShape((aCurrent, aLast) => aCurrent +. aLast);
let subtractYs = _transverseShape((aCurrent, aLast) => aCurrent -. aLast);

let findY = CdfLibrary.Distribution.findY;
let findX = CdfLibrary.Distribution.findX;

// I'm really not sure this part is actually what we want at this point.
module Range = {
  // ((lastX, lastY), (nextX, nextY))
  type zippedRange = ((float, float), (float, float));

  let floatSum = Belt.Array.reduce(_, 0., (a, b) => a +. b);
  let toT = r => r |> Belt.Array.unzip |> fromArray;
  let nextX = ((_, (nextX, _)): zippedRange) => nextX;

  let rangeAreaAssumingSteps = (((lastX, lastY), (nextX, _)): zippedRange) =>
    (nextX -. lastX) *. lastY;

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

  let inRanges = (mapper, reducer, t: t) => {
    Belt.Array.zip(t.xs, t.ys)
    |> E.A.toRanges
    |> E.R.toOption
    |> E.O.fmap(r => r |> Belt.Array.map(_, mapper) |> reducer);
  };

  let mapYsBasedOnRanges = fn => inRanges(r => (nextX(r), fn(r)), toT);

  let integrateWithSteps = z =>
    mapYsBasedOnRanges(rangeAreaAssumingSteps, z) |> E.O.fmap(accumulateYs);

  let integrateWithTriangles = z =>
    mapYsBasedOnRanges(rangeAreaAssumingTriangles, z)
    |> E.O.fmap(accumulateYs);

  let derivative = mapYsBasedOnRanges(delta_y_over_delta_x);

  let stepsToContinuous = t =>
    Belt.Array.zip(t.xs, t.ys)
    |> E.A.toRanges
    |> E.R.toOption
    |> E.O.fmap(r => r |> Belt.Array.map(_, rangePointAssumingSteps))
    |> E.O.fmap(Belt.Array.unzip)
    |> E.O.fmap(fromArray)
    |> E.O.fmap(intersperce(t));
};