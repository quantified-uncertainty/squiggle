/* A for Array */
module FloatFloatMap = E_FloatFloatMap

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
//accumulate((a,b) => a + b, [1,2,3]) => [1, 3, 6]
let accumulate = (fn: ('a, 'a) => 'a, items: array<'a>) => {
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
    optionals->filter(E_O.isSome)->fmap(E_O.toExn("Warning: This should not have happened"))
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

  let firstSomeFnWithDefault = (r, default) => firstSomeFn(r)->E_O2.default(default)

  let openIfAllSome = (optionals: array<option<'a>>): option<array<'a>> => {
    if every(optionals, E_O.isSome) {
      Some(optionals->fmap(E_O.toExn("Warning: This should not have happened")))
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

  let foldM = (fn: ('c, 'a) => result<'b, 'e>, init: 'c, x: array<'a>): result<'c, 'e> => {
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

  let cumSum = (t: t): array<float> => accumulate((a, b) => a +. b, t)
  let cumProd = (t: t): array<float> => accumulate((a, b) => a *. b, t)

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

    /*
      This function goes through a sorted array and divides it into two different clusters:
      continuous samples and discrete samples. The discrete samples are stored in a mutable map.
      Samples are considered discrete if they have at least `minDiscreteWight` duplicates.
      Using a `minDiscreteWight` higher than 2 is important because sometimes common elements
      will be generated by regular operations.
      The final continuous array will be sorted.

      The method here is designed for high performance for fairly small `minDiscreteWight`
      values for both mostly-continuous and mostly-discrete inputs.
      For each position i it visits, it compares it to the place where a run starting at i would end.
      For continuous distributions, this comparison is always false, keeping branch prediction costs low.
      If the comparison is true, it finds the complete run with recursive doubling then a binary search,
      which skips over many elements for long runs.
 */
    exception BadWeight(string)
    let splitContinuousAndDiscreteForMinWeight = (
      sortedArray: array<float>,
      ~minDiscreteWeight: int,
    ) => {
      let continuous: array<float> = []
      let discrete = FloatFloatMap.empty()

      // Weight of 1 is pointless because it indicates only discrete values,
      // and causes an infinite loop in the doubling search used here.
      if minDiscreteWeight <= 1 {
        raise(BadWeight("Minimum discrete weight must be at least 1"))
      }

      // In a run of exactly minDiscreteWeight, the first and last
      // element indices differ by minDistance.
      let minDistance = minDiscreteWeight - 1

      let len = length(sortedArray)
      let i = ref(0)
      while i.contents < len - minDistance {
        // We are interested in runs of elements equal to value
        let value = sortedArray[i.contents]
        if value != sortedArray[i.contents + minDistance] {
          // No long run starting at i, so it's continuous
          Js.Array2.push(continuous, value)->ignore
          i := i.contents + 1
        } else {
          // Now we know that a run starts at i
          // Move i forward to next unequal value
          // That is, find iNext so that isEqualAt(iNext-1) and !isEqualAt(iNext)
          let iOrig = i.contents
          // Find base so that iNext is in (iOrig+base, iOrig+2*base]
          // This is where we start the binary search
          let base = ref(minDistance)
          let isEqualAt = (ind: int) => ind < len && sortedArray[ind] == value
          while isEqualAt(iOrig + base.contents * 2) {
            base := base.contents * 2
          }
          // Maintain iNext in (lo, i]. Once lo+1 == i, i is iNext.
          let lo = ref(iOrig + base.contents)
          i := Js.Math.min_int(lo.contents + base.contents, len)
          while i.contents - lo.contents > 1 {
            let mid = lo.contents + (i.contents - lo.contents) / 2
            if sortedArray[mid] == value {
              lo := mid
            } else {
              i := mid
            }
          }

          let count = i.contents - iOrig
          FloatFloatMap.add(value, count->Belt.Int.toFloat, discrete)
        }
      }
      // Remaining values are continuous
      let tail = Belt.Array.sliceToEnd(sortedArray, i.contents)
      Js.Array2.pushMany(continuous, tail)->ignore

      (continuous, discrete)
    }
  }
}
module Sorted = Floats.Sorted
