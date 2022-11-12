/* A for Array */
let fmap = Belt.Array.map
let fmapi = Belt.Array.mapWithIndex
let forEach = Belt.Array.forEach
let forEachI = Belt.Array.forEachWithIndex
let length = Belt.Array.length
let unsafe_get = Belt.Array.getUnsafe
let get = Belt.Array.get
let getBy = Belt.Array.getBy
let getIndexBy = Belt.Array.getIndexBy
let last = a => get(a, length(a) - 1)
let first = get(_, 0)
let concat = Belt.Array.concat
let concatMany = Belt.Array.concatMany
let makeBy = Belt.Array.makeBy
let slice = Belt.Array.slice
let reduce = Belt.Array.reduce
let reduceReverse = Belt.Array.reduceReverse
let reducei = Belt.Array.reduceWithIndex
let fold_left = reduce
let some = Belt.Array.some
let every = Belt.Array.every
let isEmpty = r => length(r) < 1
let stableSortBy = Belt.SortArray.stableSortBy

let getByFmap = (a, fn, boolCondition) => {
  let i = ref(0)
  let finalFunctionValue = ref(None)
  let length = length(a)

  while i.contents < length && finalFunctionValue.contents == None {
    let itemWithFnApplied = unsafe_get(a, i.contents)->fn
    if boolCondition(itemWithFnApplied) {
      finalFunctionValue := Some(itemWithFnApplied)
    }
    i := i.contents + 1
  }

  finalFunctionValue.contents
}

let zip = Belt.Array.zip
let unzip = Belt.Array.unzip
let zip3 = (a, b, c) => zip(a, b)->zip(c)->fmap((((v1, v2), v3)) => (v1, v2, v3))

let to_list = Belt.List.fromArray
let uniq = reduce(_, [], (acc, v) => some(acc, \"=="(v)) ? acc : concat([v], acc))

//intersperse([1,2,3], [10,11,12]) => [1,10,2,11,3,12]
let intersperse = (a: array<'a>, b: array<'a>) => {
  let c = concatMany(Belt.Array.zipBy(a, b, (e, f) => [e, f]))
  // Copying old implementation: add tail of a, but not b?
  concat(c, Belt.Array.sliceToEnd(a, length(b)))
}

// This is like map, but
//[1,2,3]->accumulate((a,b) => a + b) => [1, 3, 6]
let accumulate = (items: array<'a>, fn: ('a, 'a) => 'a) => {
  let length = items->length
  let empty = Belt.Array.make(length, items->unsafe_get(0))
  forEachI(items, (index, element) => {
    let item = switch index {
    | 0 => element
    | index => fn(element, unsafe_get(empty, index - 1))
    }
    let _ = Belt.Array.set(empty, index, item)
  })
  empty
}
// Apply the operation to adjacent pairs
// Sort of a complement to accumulate
let tail = Belt.Array.sliceToEnd(_, 1)
let pairwise = (t, fn) => Belt.Array.zipBy(t, tail(t), fn)
let toRanges = a =>
  length(a) > 1 ? Ok(zip(a, tail(a))) : Belt.Result.Error("Must be at least 2 elements")

let filter = Belt.Array.keep
let joinWith = Js.Array2.joinWith
let transpose = (xs: array<array<'a>>): array<array<'a>> => {
  let arr: array<array<'a>> = []
  for i in 0 to length(xs) - 1 {
    for j in 0 to length(xs[i]) - 1 {
      if length(arr) <= j {
        ignore(Js.Array.push([xs[i][j]], arr))
      } else {
        ignore(Js.Array.push(xs[i][j], arr[j]))
      }
    }
  }
  arr
}

module O = {
  let concatSomes = (optionals: array<option<'a>>): array<'a> =>
    optionals->filter(E_O.isSome)->fmap(E_O.toExn(_, "Warning: This should not have happened"))
  let defaultEmpty = (o: option<array<'a>>): array<'a> =>
    switch o {
    | Some(o) => o
    | None => []
    }
  // REturns `None` there are no non-`None` elements
  let rec arrSomeToSomeArr = (optionals: array<option<'a>>): option<array<'a>> => {
    let optionals' = optionals->Belt.List.fromArray
    switch optionals' {
    | list{} => []->Some
    | list{x, ...xs} =>
      switch x {
      | Some(_) => xs->Belt.List.toArray->arrSomeToSomeArr
      | None => None
      }
    }
  }
  let firstSome = x => getBy(x, E_O.isSome)

  let firstSomeFn = (r: array<unit => option<'a>>): option<'a> =>
    E_O.flatten(getByFmap(r, l => l(), E_O.isSome))

  let firstSomeFnWithDefault = (r, default) => firstSomeFn(r)->E_O.default(default)

  let openIfAllSome = (optionals: array<option<'a>>): option<array<'a>> => {
    if every(optionals, E_O.isSome) {
      Some(optionals->fmap(E_O.toExn(_, "Warning: This should not have happened")))
    } else {
      None
    }
  }
}

module R = {
  let firstErrorOrOpen = (results: array<Belt.Result.t<'a, 'b>>): Belt.Result.t<array<'a>, 'b> => {
    let bringErrorUp = switch results->getBy(Belt.Result.isError) {
    | Some(Belt.Result.Error(err)) => Belt.Result.Error(err)
    | Some(Belt.Result.Ok(_)) => Belt.Result.Ok(results)
    | None => Belt.Result.Ok(results)
    }
    let forceOpen = (r: array<Belt.Result.t<'a, 'b>>): array<'a> => r->fmap(Belt.Result.getExn)
    bringErrorUp->Belt.Result.map(forceOpen)
  }
  let filterOk = (x: array<result<'a, 'b>>): array<'a> => x->fmap(E_R.toOption)->O.concatSomes

  let forM = (x: array<'a>, fn: 'a => result<'b, 'c>): result<array<'b>, 'c> =>
    firstErrorOrOpen(fmap(x, fn))

  let foldM = (x: array<'a>, init: 'c, fn: ('c, 'a) => result<'b, 'e>): result<'c, 'e> => {
    let acc = ref(init)
    let final = ref(Ok())
    let break = ref(false)
    let i = ref(0)

    while break.contents != true && i.contents < length(x) {
      switch fn(acc.contents, x[i.contents]) {
      | Ok(r) => acc := r
      | Error(err) => {
          final := Error(err)
          break := true
        }
      }
      i := i.contents + 1
    }
    switch final.contents {
    | Ok(_) => Ok(acc.contents)
    | Error(err) => Error(err)
    }
  }
}

module Floats = {
  type t = array<float>
  let mean = Jstat.mean
  let geomean = Jstat.geomean
  let mode = Jstat.mode
  let variance = Jstat.variance
  let stdev = Jstat.stdev
  let sum = Jstat.sum
  let product = Jstat.product
  let random = Js.Math.random_int

  let floatCompare: (float, float) => int = compare
  let sort = t => {
    let typedArray = t->Js.TypedArray2.Float64Array.make
    typedArray->Js.TypedArray2.Float64Array.sortInPlace->ignore
    // why is there no standard function in Resctipt for this?
    let typedArrayToArray: Js.TypedArray2.Float64Array.t => t = %raw(`a => Array.from(a)`)
    typedArrayToArray(typedArray)
  }

  let getNonFinite = (t: t) => getBy(t, r => !Js.Float.isFinite(r))
  let getBelowZero = (t: t) => getBy(t, r => r < 0.0)

  let isSorted = (t: t): bool =>
    if length(t) < 1 {
      true
    } else {
      t->pairwise((first, second) => first < second)->Belt.Array.every(t => t)
    }

  //Passing true for the exclusive parameter excludes both endpoints of the range.
  //https://jstat.github.io/all.html
  let percentile = (a, b) => Jstat.percentile(a, b, false)

  // Gives an array with all the differences between values
  // diff([1,5,3,7]) = [4,-2,4]
  let diff = (t: t): array<float> => t->pairwise((left, right) => right -. left)

  let cumSum = (t: t): array<float> => t->accumulate((a, b) => a +. b)
  let cumProd = (t: t): array<float> => t->accumulate((a, b) => a *. b)

  exception RangeError(string)
  let range = (min: float, max: float, n: int): array<float> =>
    switch n {
    | 0 => []
    | 1 => [min]
    | 2 => [min, max]
    | _ if min == max => Belt.Array.make(n, min)
    | _ if n < 0 => raise(RangeError("n must be greater than 0"))
    | _ if min > max => raise(RangeError("Min value is less then max value"))
    | _ =>
      let diff = (max -. min) /. Belt.Float.fromInt(n - 1)
      makeBy(n, i => min +. Belt.Float.fromInt(i) *. diff)
    }

  let min = Js.Math.minMany_float
  let max = Js.Math.maxMany_float

  module Sorted = {
    let min = first
    let max = last
    let range = (~min=min, ~max=max, a) =>
      switch (min(a), max(a)) {
      | (Some(min), Some(max)) => Some(max -. min)
      | _ => None
      }

    let binarySearchFirstElementGreaterIndex = (ar: array<'a>, el: 'a) => {
      let el = Belt.SortArray.binarySearchBy(ar, el, floatCompare)
      let el = el < 0 ? el * -1 - 1 : el
      switch el {
      | e if e >= length(ar) => #overMax
      | e if e == 0 => #underMin
      | e => #firstHigher(e)
      }
    }

    let concat = (t1: array<'a>, t2: array<'a>) => concat(t1, t2)->sort

    let concatMany = (t1: array<array<'a>>) => concatMany(t1)->sort

    let makeIncrementalUp = (a, b) => makeBy(b - a + 1, i => float_of_int(a + i))

    let makeIncrementalDown = (a, b) => makeBy(a - b + 1, i => float_of_int(a - i))
  }
}
module Sorted = Floats.Sorted
