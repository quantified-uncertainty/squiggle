open Rationale.Function.Infix
module FloatFloatMap = {
  module Id = Belt.Id.MakeComparable({
    type t = float
    let cmp: (float, float) => int = Pervasives.compare
  })

  type t = Belt.MutableMap.t<Id.t, float, Id.identity>

  let fromArray = (ar: array<(float, float)>) => Belt.MutableMap.fromArray(ar, ~id=module(Id))
  let toArray = (t: t) => Belt.MutableMap.toArray(t)
  let empty = () => Belt.MutableMap.make(~id=module(Id))
  let increment = (el, t: t) =>
    Belt.MutableMap.update(t, el, x =>
      switch x {
      | Some(n) => Some(n +. 1.0)
      | None => Some(1.0)
      }
    )

  let get = (el, t: t) => Belt.MutableMap.get(t, el)
  let fmap = (fn, t: t) => Belt.MutableMap.map(t, fn)
}

module Int = {
  let max = (i1: int, i2: int) => i1 > i2 ? i1 : i2
  let random = (~min, ~max) => Js.Math.random_int(min, max)
}
/* Utils */
module U = {
  let isEqual = \"=="
  let toA = a => [a]
  let id = e => e
}

module Tuple2 = {
  let first = (v: ('a, 'b)) => {
    let (a, _) = v
    a
  }
  let second = (v: ('a, 'b)) => {
    let (_, b) = v
    b
  }
}

module O = {
  let dimap = (sFn, rFn, e) =>
    switch e {
    | Some(r) => sFn(r)
    | None => rFn()
    }
  ()
  let fmap = Rationale.Option.fmap
  let bind = Rationale.Option.bind
  let default = Rationale.Option.default
  let isSome = Rationale.Option.isSome
  let isNone = Rationale.Option.isNone
  let toExn = Rationale.Option.toExn
  let some = Rationale.Option.some
  let firstSome = Rationale.Option.firstSome
  let toExt = Rationale.Option.toExn // wanna flag this-- looks like a typo but `Rationale.OptiontoExt` doesn't exist.
  let flatApply = (fn, b) => Rationale.Option.apply(fn, Some(b)) |> Rationale.Option.flatten
  let flatten = Rationale.Option.flatten

  let toBool = opt =>
    switch opt {
    | Some(_) => true
    | _ => false
    }

  let ffmap = (fn, r) =>
    switch r {
    | Some(sm) => fn(sm)
    | _ => None
    }

  let toString = opt =>
    switch opt {
    | Some(s) => s
    | _ => ""
    }

  let toResult = (error, e) =>
    switch e {
    | Some(r) => Belt.Result.Ok(r)
    | None => Error(error)
    }

  let compare = (compare, f1: option<float>, f2: option<float>) =>
    switch (f1, f2) {
    | (Some(f1), Some(f2)) => Some(compare(f1, f2) ? f1 : f2)
    | (Some(f1), None) => Some(f1)
    | (None, Some(f2)) => Some(f2)
    | (None, None) => None
    }

  let min = compare(\"<")
  let max = compare(\">")
}

module O2 = {
  let default = (a, b) => O.default(b, a)
  let toExn = (a, b) => O.toExn(b, a)
  let fmap = (a, b) => O.fmap(b, a)
  let toResult = (a, b) => O.toResult(b, a)
  let bind = (a, b) => O.bind(b, a)
}

/* Functions */
module F = {
  let apply = (a, e) => a |> e

  let flatten2Callbacks = (fn1, fn2, fnlast) =>
    fn1(response1 => fn2(response2 => fnlast(response1, response2)))

  let flatten3Callbacks = (fn1, fn2, fn3, fnlast) =>
    fn1(response1 => fn2(response2 => fn3(response3 => fnlast(response1, response2, response3))))

  let flatten4Callbacks = (fn1, fn2, fn3, fn4, fnlast) =>
    fn1(response1 =>
      fn2(response2 =>
        fn3(response3 => fn4(response4 => fnlast(response1, response2, response3, response4)))
      )
    )
}

module Bool = {
  type t = bool
  let toString = (t: t) => t ? "TRUE" : "FALSE"
  let fromString = str => str == "TRUE" ? true : false

  module O = {
    let toBool = opt =>
      switch opt {
      | Some(true) => true
      | _ => false
      }
  }
}

module Float = {
  let with2DigitsPrecision = Js.Float.toPrecisionWithPrecision(_, ~digits=2)
  let with3DigitsPrecision = Js.Float.toPrecisionWithPrecision(_, ~digits=3)
  let toFixed = Js.Float.toFixed
  let toString = Js.Float.toString
}

module I = {
  let increment = n => n + 1
  let decrement = n => n - 1
  let toString = Js.Int.toString
}

exception Assertion(string)

/* R for Result */
module R = {
  let result = Rationale.Result.result
  let id = e => e |> result(U.id, U.id)
  let fmap = Rationale.Result.fmap
  let bind = Rationale.Result.bind
  let toExn = (msg: string, x: result<'a, 'b>): 'a =>
    switch x {
    | Ok(r) => r
    | Error(_) => raise(Assertion(msg))
    }

  let default = (default, res: Belt.Result.t<'a, 'b>) =>
    switch res {
    | Ok(r) => r
    | Error(_) => default
    }
  let merge = (a, b) =>
    switch (a, b) {
    | (Error(e), _) => Error(e)
    | (_, Error(e)) => Error(e)
    | (Ok(a), Ok(b)) => Ok((a, b))
    }
  let toOption = (e: Belt.Result.t<'a, 'b>) =>
    switch e {
    | Ok(r) => Some(r)
    | Error(_) => None
    }

  let errorIfCondition = (errorCondition, errorMessage, r) =>
    errorCondition(r) ? Error(errorMessage) : Ok(r)

  let ap = Rationale.Result.ap
  let ap' = (r, a) =>
    switch r {
    | Ok(f) => fmap(f, a)
    | Error(err) => Error(err)
    }

  // (a1 -> a2 -> r) -> m a1 -> m a2 -> m r  // not in Rationale
  let liftM2: (('a, 'b) => 'c, result<'a, 'd>, result<'b, 'd>) => result<'c, 'd> = (op, xR, yR) => {
    ap'(fmap(op, xR), yR)
  }

  let liftJoin2: (('a, 'b) => result<'c, 'd>, result<'a, 'd>, result<'b, 'd>) => result<'c, 'd> = (
    op,
    xR,
    yR,
  ) => {
    bind(liftM2(op, xR, yR), x => x)
  }

  let fmap2 = (f, r) =>
    switch r {
    | Ok(r) => r->Ok
    | Error(x) => x->f->Error
    }
}

module R2 = {
  let fmap = (a, b) => R.fmap(b, a)
  let bind = (a, b) => R.bind(b, a)

  //Converts result type to change error type only
  let errMap = (a: result<'a, 'b>, map: 'b => 'c): result<'a, 'c> =>
    switch a {
    | Ok(r) => Ok(r)
    | Error(e) => Error(map(e))
    }

  let fmap2 = (xR, f) =>
    switch xR {
    | Ok(x) => x->Ok
    | Error(x) => x->f->Error
    }
}

let safe_fn_of_string = (fn, s: string): option<'a> =>
  try Some(fn(s)) catch {
  | _ => None
  }

module S = {
  let safe_float = float_of_string->safe_fn_of_string
  let safe_int = int_of_string->safe_fn_of_string
  let default = (defaultStr, str) => str == "" ? defaultStr : str
}

module J = {
  let toString = \"||>"(Js.Json.decodeString, O.default(""))
  let fromString = Js.Json.string
  let fromNumber = Js.Json.number

  module O = {
    let fromString = (str: string) =>
      switch str {
      | "" => None
      | _ => Some(Js.Json.string(str))
      }

    let toString = (str: option<'a>) =>
      switch str {
      | Some(str) => Some(str |> \"||>"(Js.Json.decodeString, O.default("")))
      | _ => None
      }
  }
}

module JsDate = {
  let fromString = Js.Date.fromString
  let now = Js.Date.now
  let make = Js.Date.make
  let valueOf = Js.Date.valueOf
}

/* List */
module L = {
  let fmap = List.map
  let get = Belt.List.get
  let toArray = Array.of_list
  let fmapi = List.mapi
  let concat = List.concat
  let drop = Rationale.RList.drop
  let remove = Rationale.RList.remove
  let find = List.find
  let filter = List.filter
  let for_all = List.for_all
  let exists = List.exists
  let sort = List.sort
  let length = List.length
  let filter_opt = Rationale.RList.filter_opt
  let uniqBy = Rationale.RList.uniqBy
  let join = Rationale.RList.join
  let head = Rationale.RList.head
  let uniq = Rationale.RList.uniq
  let flatten = List.flatten
  let last = Rationale.RList.last
  let append = List.append
  let getBy = Belt.List.getBy
  let dropLast = Rationale.RList.dropLast
  let contains = Rationale.RList.contains
  let without = Rationale.RList.without
  let update = Rationale.RList.update
  let iter = List.iter
  let findIndex = Rationale.RList.findIndex
  let headSafe = Belt.List.head
  let tailSafe = Belt.List.tail
  let headExn = Belt.List.headExn
  let tailExn = Belt.List.tailExn
  let zip = Belt.List.zip

  let combinations2: list<'a> => list<('a, 'a)> = xs => {
    let rec loop: ('a, list<'a>) => list<('a, 'a)> = (x', xs') => {
      let n = length(xs')
      if n == 0 {
        list{}
      } else {
        let combs = fmap(y => (x', y), xs')
        let hd = headExn(xs')
        let tl = tailExn(xs')
        concat(list{combs, loop(hd, tl)})
      }
    }
    switch (headSafe(xs), tailSafe(xs)) {
    | (Some(x'), Some(xs')) => loop(x', xs')
    | (_, _) => list{}
    }
  }
}

/* A for Array */
module A = {
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
  let last = a => get(a, length(a) - 1)
  let first = get(_, 0)
  let hasBy = (r, fn) => Belt.Array.getBy(r, fn) |> O.isSome
  let fold_left = Array.fold_left
  let fold_right = Array.fold_right
  let concatMany = Belt.Array.concatMany
  let keepMap = Belt.Array.keepMap
  let slice = Belt.Array.slice
  let init = Array.init
  let reduce = Belt.Array.reduce
  let reducei = Belt.Array.reduceWithIndex
  let isEmpty = r => length(r) < 1
  let stableSortBy = Belt.SortArray.stableSortBy
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
      |> Rationale.Result.return
    }

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

  module O = {
    let concatSomes = (optionals: array<option<'a>>): array<'a> =>
      optionals
      |> Js.Array.filter(Rationale.Option.isSome)
      |> Js.Array.map(Rationale.Option.toExn("Warning: This should not have happened"))
    let defaultEmpty = (o: option<array<'a>>): array<'a> =>
      switch o {
      | Some(o) => o
      | None => []
      }
  }

  module R = {
    let firstErrorOrOpen = (results: array<Belt.Result.t<'a, 'b>>): Belt.Result.t<
      array<'a>,
      'b,
    > => {
      let bringErrorUp = switch results |> Belt.Array.getBy(_, Belt.Result.isError) {
      | Some(Belt.Result.Error(err)) => Belt.Result.Error(err)
      | Some(Belt.Result.Ok(_)) => Belt.Result.Ok(results)
      | None => Belt.Result.Ok(results)
      }
      let forceOpen = (r: array<Belt.Result.t<'a, 'b>>): array<'a> =>
        r |> Belt.Array.map(_, r => Belt.Result.getExn(r))
      bringErrorUp |> Belt.Result.map(_, forceOpen)
    }
    let filterOk = (x: array<result<'a, 'b>>): array<'a> => fmap(R.toOption, x)->O.concatSomes

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

  module Sorted = {
    let min = first
    let max = last
    let range = (~min=min, ~max=max, a) =>
      switch (min(a), max(a)) {
      | (Some(min), Some(max)) => Some(max -. min)
      | _ => None
      }

    let floatCompare: (float, float) => int = compare

    let binarySearchFirstElementGreaterIndex = (ar: array<'a>, el: 'a) => {
      let el = Belt.SortArray.binarySearchBy(ar, el, floatCompare)
      let el = el < 0 ? el * -1 - 1 : el
      switch el {
      | e if e >= length(ar) => #overMax
      | e if e == 0 => #underMin
      | e => #firstHigher(e)
      }
    }

    let concat = (t1: array<'a>, t2: array<'a>) => {
      let ts = Belt.Array.concat(t1, t2)
      ts |> Array.fast_sort(floatCompare)
      ts
    }

    let concatMany = (t1: array<array<'a>>) => {
      let ts = Belt.Array.concatMany(t1)
      ts |> Array.fast_sort(floatCompare)
      ts
    }

    module Floats = {
      let makeIncrementalUp = (a, b) =>
        Array.make(b - a + 1, a) |> Array.mapi((i, c) => c + i) |> Belt.Array.map(_, float_of_int)

      let makeIncrementalDown = (a, b) =>
        Array.make(a - b + 1, a) |> Array.mapi((i, c) => c - i) |> Belt.Array.map(_, float_of_int)

      let split = (sortedArray: array<float>) => {
        let continuous = []
        let discrete = FloatFloatMap.empty()
        Belt.Array.forEachWithIndex(sortedArray, (index, element) => {
          let maxIndex = (sortedArray |> Array.length) - 1
          let possiblySimilarElements = switch index {
          | 0 => [index + 1]
          | n if n == maxIndex => [index - 1]
          | _ => [index - 1, index + 1]
          } |> Belt.Array.map(_, r => sortedArray[r])
          // let hasSimilarElement = Belt.Array.some(possiblySimilarElements, r => r == element)
          let hasSimilarElement = false
          hasSimilarElement
            ? FloatFloatMap.increment(element, discrete)
            : {
                let _ = Js.Array.push(element, continuous)
              }

          ()
        })

        (continuous, discrete)
      }
    }
  }

  module Floats = {
    let mean = Jstat.mean
    let geomean = Jstat.geomean
    let mode = Jstat.mode
    let variance = Jstat.variance
    let stdev = Jstat.stdev
    let sum = Jstat.sum
    let random = Js.Math.random_int

    //Passing true for the exclusive parameter excludes both endpoints of the range.
    //https://jstat.github.io/all.html
    let percentile = (a,b) => Jstat.percentile(a,b, false)

    // Gives an array with all the differences between values
    // diff([1,5,3,7]) = [4,-2,4]
    let diff = (arr: array<float>): array<float> =>
      Belt.Array.zipBy(arr, Belt.Array.sliceToEnd(arr, 1), (left, right) => right -. left)

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
  }
}

module A2 = {
  let fmap = (a, b) => A.fmap(b, a)
  let joinWith = (a, b) => A.joinWith(b, a)
}

module JsArray = {
  let concatSomes = (optionals: Js.Array.t<option<'a>>): Js.Array.t<'a> =>
    optionals
    |> Js.Array.filter(Rationale.Option.isSome)
    |> Js.Array.map(Rationale.Option.toExn("Warning: This should not have happened"))
  let filter = Js.Array.filter
}
