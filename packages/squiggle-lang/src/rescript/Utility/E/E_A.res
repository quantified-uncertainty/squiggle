/* A for Array */
// module O = E_O
module Int = E_Int
module L = E_L
module FloatFloatMap = E_FloatFloatMap

let fmap = Array.map
let fmapi = Array.mapi
let to_list = Array.to_list
let of_list = Array.of_list
let length = Array.length
let append = Array.append
// let empty = [||];
let unsafe_get = Array.unsafe_get
let get = Belt.Array.get
let getBy = Belt.Array.getBy
let getIndexBy = Belt.Array.getIndexBy
let last = a => get(a, length(a) - 1)
let first = get(_, 0)
let hasBy = (r, fn) => Belt.Array.getBy(r, fn) |> E_O.isSome
let fold_left = Array.fold_left
let fold_right = Array.fold_right
let concat = Belt.Array.concat
let concatMany = Belt.Array.concatMany
let keepMap = Belt.Array.keepMap
let slice = Belt.Array.slice
let init = Array.init
let reduce = Belt.Array.reduce
let reduceReverse = Belt.Array.reduceReverse
let reducei = Belt.Array.reduceWithIndex
let some = Belt.Array.some
let isEmpty = r => length(r) < 1
let stableSortBy = Belt.SortArray.stableSortBy
let toNoneIfEmpty = r => isEmpty(r) ? None : Some(r)
let toRanges = (a: array<'a>) =>
  switch a |> Belt.Array.length {
  | 0
  | 1 =>
    Belt.Result.Error("Must be at least 2 elements")
  | n =>
    Belt.Array.makeBy(n - 1, r => r)
    |> Belt.Array.map(_, index => (
      Belt.Array.getUnsafe(a, index),
      Belt.Array.getUnsafe(a, index + 1),
    ))
    |> (x => Ok(x))
  }

let getByFmap = (a, fn, boolCondition) => {
  let i = ref(0)
  let finalFunctionValue = ref(None)
  let length = Belt.Array.length(a)

  while i.contents < length && finalFunctionValue.contents == None {
    let itemWithFnApplied = Belt.Array.getUnsafe(a, i.contents) |> fn
    if boolCondition(itemWithFnApplied) {
      finalFunctionValue := Some(itemWithFnApplied)
    }
    i := i.contents + 1
  }

  finalFunctionValue.contents
}

let tail = Belt.Array.sliceToEnd(_, 1)

let zip = Belt.Array.zip
let unzip = Belt.Array.unzip
let zip3 = (a, b, c) =>
  Belt.Array.zip(a, b)->Belt.Array.zip(c)->Belt.Array.map((((v1, v2), v3)) => (v1, v2, v3))
// This zips while taking the longest elements of each array.
let zipMaxLength = (array1, array2) => {
  let maxLength = Int.max(length(array1), length(array2))
  let result = maxLength |> Belt.Array.makeUninitializedUnsafe
  for i in 0 to maxLength - 1 {
    Belt.Array.set(result, i, (get(array1, i), get(array2, i))) |> ignore
  }
  result
}

let asList = (f: list<'a> => list<'a>, r: array<'a>) => r |> to_list |> f |> of_list
/* TODO: Is there a better way of doing this? */
let uniq = r => asList(L.uniq, r)

//intersperse([1,2,3], [10,11,12]) => [1,10,2,11,3,12]
let intersperse = (a: array<'a>, b: array<'a>) => {
  let items: ref<array<'a>> = ref([])

  Belt.Array.forEachWithIndex(a, (i, item) =>
    switch Belt.Array.get(b, i) {
    | Some(r) => items := append(items.contents, [item, r])
    | None => items := append(items.contents, [item])
    }
  )
  items.contents
}

// This is like map, but
//accumulate((a,b) => a + b, [1,2,3]) => [1, 3, 5]
let accumulate = (fn: ('a, 'a) => 'a, items: array<'a>) => {
  let length = items |> length
  let empty = Belt.Array.make(length, items |> unsafe_get(_, 0))
  Belt.Array.forEachWithIndex(items, (index, element) => {
    let item = switch index {
    | 0 => element
    | index => fn(element, unsafe_get(empty, index - 1))
    }
    let _ = Belt.Array.set(empty, index, item)
  })
  empty
}

// @todo: Is -1 still the indicator that this is false (as is true with
// @todo: js findIndex)? Wasn't sure.
let findIndex = (e, i) =>
  Js.Array.findIndex(e, i) |> (
    r =>
      switch r {
      | -1 => None
      | r => Some(r)
      }
  )
let filter = Js.Array.filter
let joinWith = Js.Array.joinWith
let transpose = (xs: array<array<'a>>): array<array<'a>> => {
  let arr: array<array<'a>> = []
  for i in 0 to length(xs) - 1 {
    for j in 0 to length(xs[i]) - 1 {
      if Js.Array.length(arr) <= j {
        ignore(Js.Array.push([xs[i][j]], arr))
      } else {
        ignore(Js.Array.push(xs[i][j], arr[j]))
      }
    }
  }
  arr
}

let all = (p: 'a => bool, xs: array<'a>): bool => length(filter(p, xs)) == length(xs)
let any = (p: 'a => bool, xs: array<'a>): bool => length(filter(p, xs)) > 0

module O = {
  let concatSomes = (optionals: array<option<'a>>): array<'a> =>
    optionals
    |> Js.Array.filter(E_O.isSome)
    |> Js.Array.map(E_O.toExn("Warning: This should not have happened"))
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
  let firstSome = x => Belt.Array.getBy(x, E_O.isSome)

  let firstSomeFn = (r: array<unit => option<'a>>): option<'a> =>
    E_O.flatten(getByFmap(r, l => l(), E_O.isSome))

  let firstSomeFnWithDefault = (r, default) => firstSomeFn(r)->E_O2.default(default)

  let openIfAllSome = (optionals: array<option<'a>>): option<array<'a>> => {
    if all(E_O.isSome, optionals) {
      Some(optionals |> fmap(E_O.toExn("Warning: This should not have happened")))
    } else {
      None
    }
  }
}

module R = {
  let firstErrorOrOpen = (results: array<Belt.Result.t<'a, 'b>>): Belt.Result.t<array<'a>, 'b> => {
    let bringErrorUp = switch results |> Belt.Array.getBy(_, Belt.Result.isError) {
    | Some(Belt.Result.Error(err)) => Belt.Result.Error(err)
    | Some(Belt.Result.Ok(_)) => Belt.Result.Ok(results)
    | None => Belt.Result.Ok(results)
    }
    let forceOpen = (r: array<Belt.Result.t<'a, 'b>>): array<'a> =>
      r |> Belt.Array.map(_, r => Belt.Result.getExn(r))
    bringErrorUp |> Belt.Result.map(_, forceOpen)
  }
  let filterOk = (x: array<result<'a, 'b>>): array<'a> => fmap(E_R.toOption, x)->O.concatSomes

  let forM = (x: array<'a>, fn: 'a => result<'b, 'c>): result<array<'b>, 'c> =>
    firstErrorOrOpen(fmap(fn, x))

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
    let r = t
    r |> Array.fast_sort(floatCompare)
    r
  }

  let getNonFinite = (t: t) => Belt.Array.getBy(t, r => !Js.Float.isFinite(r))
  let getBelowZero = (t: t) => Belt.Array.getBy(t, r => r < 0.0)

  let isSorted = (t: t): bool =>
    if Array.length(t) < 1 {
      true
    } else {
      reduce(zip(t, tail(t)), true, (acc, (first, second)) => acc && first < second)
    }

  //Passing true for the exclusive parameter excludes both endpoints of the range.
  //https://jstat.github.io/all.html
  let percentile = (a, b) => Jstat.percentile(a, b, false)

  // Gives an array with all the differences between values
  // diff([1,5,3,7]) = [4,-2,4]
  let diff = (t: t): array<float> =>
    Belt.Array.zipBy(t, Belt.Array.sliceToEnd(t, 1), (left, right) => right -. left)

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
      Belt.Array.makeBy(n, i => min +. Belt.Float.fromInt(i) *. diff)
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

    let concat = (t1: array<'a>, t2: array<'a>) => Belt.Array.concat(t1, t2)->sort

    let concatMany = (t1: array<array<'a>>) => Belt.Array.concatMany(t1)->sort

    let makeIncrementalUp = (a, b) =>
      Array.make(b - a + 1, a) |> Array.mapi((i, c) => c + i) |> Belt.Array.map(_, float_of_int)

    let makeIncrementalDown = (a, b) =>
      Array.make(a - b + 1, a) |> Array.mapi((i, c) => c - i) |> Belt.Array.map(_, float_of_int)

    /*
      This function goes through a sorted array and divides it into two different clusters:
      continuous samples and discrete samples. The discrete samples are stored in a mutable map.
      Samples are thought to be discrete if they have at least `minDiscreteWight` duplicates.

      If the min discreet weight is 4, that would mean that at least four elements needed from a specific
      value for that to be kept as discrete. This is important because in some cases, we can expect that
      some common elements will be generated by regular operations. The final continous array will be sorted.
 */
    let splitContinuousAndDiscreteForMinWeight = (
      sortedArray: array<float>,
      ~minDiscreteWeight: int,
    ) => {
      let continuous: array<float> = []
      let discrete = FloatFloatMap.empty()

      let flush = (cnt: int, value: float): unit => {
        if cnt >= minDiscreteWeight {
          FloatFloatMap.add(value, cnt->Belt.Int.toFloat, discrete)
        } else {
          for _ in 1 to cnt {
            let _ = continuous->Js.Array2.push(value)
          }
        }
      }

      if sortedArray->Js.Array2.length != 0 {
        let (finalCnt, finalValue) = sortedArray->Belt.Array.reduce(
          // initial prev value doesn't matter; if it collides with the first element of the array, flush won't do anything
          (0, 0.),
          ((cnt, prev), element) => {
            if element == prev {
              (cnt + 1, prev)
            } else {
              // new value, process previous ones
              flush(cnt, prev)
              (1, element)
            }
          }
        )

        // flush final values
        flush(finalCnt, finalValue)
      }

      (continuous, discrete)
    }
  }
}
module Sorted = Floats.Sorted
