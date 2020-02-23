open DistTypes;
let _lastElement = (a: array('a)) =>
  switch (Belt.Array.size(a)) {
  | 0 => None
  | n => Belt.Array.get(a, n - 1)
  };

type t = xyShape;

let toJs = (t: t) => {
  {"xs": t.xs, "ys": t.ys};
};

let minX = (t: t) => t.xs |> E.A.get(_, 0);
// TODO: Check if this actually gets the last element, I'm not sure it does.
let maxX = (t: t) => t.xs |> (r => E.A.get(r, E.A.length(r) - 1));

let zip = t => Belt.Array.zip(t.xs, t.ys);

let fmap = (t: t, y): t => {xs: t.xs, ys: t.ys |> E.A.fmap(y)};

let fromArray = ((xs, ys)): t => {xs, ys};
let fromArrays = (xs, ys): t => {xs, ys};
let pointwiseMap = (fn, t: t): t => {xs: t.xs, ys: t.ys |> E.A.fmap(fn)};

let compare = (a: float, b: float) => a > b ? 1 : (-1);

let comparePoints = ((x1: float, y1: float), (x2: float, y2: float)) =>
  switch (x1 == x2, y1 == y2) {
  | (false, _) => compare(x1, x2)
  | (true, false) => compare(y1, y2)
  | (true, true) => (-1)
  };

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

let scaleCdfTo = (~scaleTo=1., t: t) =>
  switch (_lastElement(t.ys)) {
  | Some(n) =>
    let scaleBy = scaleTo /. n;
    fmap(t, r => r *. scaleBy);
  | None => t
  };

let yFold = (fn, t: t) => {
  E.A.fold_left(fn, 0., t.ys);
};

let ySum = yFold((a, b) => a +. b);

let _transverse = fn =>
  Belt.Array.reduce(_, [||], (items, (x, y)) =>
    switch (_lastElement(items)) {
    | Some((xLast, yLast)) =>
      Belt.Array.concat(items, [|(x, fn(y, yLast))|])
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