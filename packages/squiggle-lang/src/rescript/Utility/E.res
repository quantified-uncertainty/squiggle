/*
Some functions from modules `L`, `O`, and `R` below were copied directly from
running `rescript convert -all` on Rationale https://github.com/jonlaing/rationale
*/

let equals = (a, b) => a === b

module FloatFloatMap = {
  module Id = Belt.Id.MakeComparable({
    type t = float
    let cmp: (float, float) => int = Pervasives.compare
  })

  type t = Belt.MutableMap.t<Id.t, float, Id.identity>

  let fromArray = (ar: array<(float, float)>) => Belt.MutableMap.fromArray(ar, ~id=module(Id))
  let toArray = (t: t): array<(float, float)> => Belt.MutableMap.toArray(t)
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
  let partition = (fn, t: t) => {
    let (match, noMatch) = Belt.Array.partition(toArray(t), fn)
    (fromArray(match), fromArray(noMatch))
  }
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
  let toFnCall = (fn, (a1, a2)) => fn(a1, a2)
}

module Tuple3 = {
  let toFnCall = (fn, (a1, a2, a3)) => fn(a1, a2, a3)
}

module O = {
  let dimap = (sFn, rFn, e) =>
    switch e {
    | Some(r) => sFn(r)
    | None => rFn()
    }
  ()
  let fmap = (f: 'a => 'b, x: option<'a>): option<'b> => {
    switch x {
    | None => None
    | Some(x') => Some(f(x'))
    }
  }
  let bind = (o, f) =>
    switch o {
    | None => None
    | Some(a) => f(a)
    }
  let default = (d, o) =>
    switch o {
    | None => d
    | Some(a) => a
    }
  let defaultFn = (d, o) =>
    switch o {
    | None => d()
    | Some(a) => a
    }
  let isSome = o =>
    switch o {
    | Some(_) => true
    | _ => false
    }
  let isNone = o =>
    switch o {
    | None => true
    | _ => false
    }
  let toExn = (err, o) =>
    switch o {
    | None => raise(Failure(err))
    | Some(a) => a
    }

  let some = a => Some(a)
  let firstSome = (a, b) =>
    switch a {
    | None => b
    | _ => a
    }

  let toExt = toExn

  let flatten = o =>
    switch o {
    | None => None
    | Some(x) => x
    }

  let apply = (o, a) =>
    switch o {
    | Some(f) => bind(a, b => some(f(b)))
    | _ => None
    }
  let flatApply = (fn, b) => apply(fn, Some(b)) |> flatten

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
  let defaultFn = (a, b) => O.defaultFn(b, a)
  let toExn = (a, b) => O.toExn(b, a)
  let fmap = (a, b) => O.fmap(b, a)
  let toResult = (a, b) => O.toResult(b, a)
  let bind = (a, b) => O.bind(b, a)
}

/* Functions */
module F = {
  let pipe = (f, g, x) => g(f(x))
  let compose = (f, g, x) => f(g(x))
  let flip = (f, a, b) => f(b, a)
  let always = (x, _y) => x

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
  let isFinite = Js.Float.isFinite
  let toInt = Belt.Float.toInt
}

module I = {
  let increment = n => n + 1
  let decrement = n => n - 1
  let toString = Js.Int.toString
  let toFloat = Js.Int.toFloat
}

exception Assertion(string)

/* R for Result */
module R = {
  open Belt.Result
  let result = (okF, errF, r) =>
    switch r {
    | Ok(a) => okF(a)
    | Error(err) => errF(err)
    }
  let id = e => e |> result(U.id, U.id)
  let isOk = Belt.Result.isOk
  let getError = (r: result<'a, 'b>) =>
    switch r {
    | Ok(_) => None
    | Error(e) => Some(e)
    }
  let fmap = (f: 'a => 'b, r: result<'a, 'c>): result<'b, 'c> => {
    switch r {
    | Ok(r') => Ok(f(r'))
    | Error(err) => Error(err)
    }
  }
  let bind = (r, f) =>
    switch r {
    | Ok(a) => f(a)
    | Error(err) => Error(err)
    }
  let toExn = (msg: string, x: result<'a, 'b>): 'a =>
    switch x {
    | Ok(r) => r
    | Error(_) => raise(Assertion(msg))
    }
  let toExnFnString = (errorToStringFn, o) =>
    switch o {
    | Ok(r) => r
    | Error(r) => raise(Assertion(errorToStringFn(r)))
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

  let ap = (r, a) =>
    switch r {
    | Ok(f) => Ok(f(a))
    | Error(err) => Error(err)
    }
  let ap' = (r, a) =>
    switch r {
    | Ok(f) => fmap(f, a)
    | Error(err) => Error(err)
    }

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

  //I'm not sure what to call this.
  let unify = (a: result<'a, 'b>, c: 'b => 'a): 'a =>
    switch a {
    | Ok(x) => x
    | Error(x) => c(x)
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

  let toExn = (a, b) => R.toExn(b, a)
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
  let toString = F.pipe(Js.Json.decodeString, O.default(""))
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
      | Some(str) => Some(str |> F.pipe(Js.Json.decodeString, O.default("")))
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
  module Util = {
    let eq = \"=="
  }
  let fmap = List.map
  let get = Belt.List.get
  let toArray = Array.of_list
  let fmapi = List.mapi
  let concat = List.concat
  let concat' = (xs, ys) => List.append(ys, xs)

  let rec drop = (i, xs) =>
    switch (i, xs) {
    | (_, list{}) => list{}
    | (i, _) if i <= 0 => xs
    | (i, list{_, ...b}) => drop(i - 1, b)
    }

  let append = (a, xs) => List.append(xs, list{a})
  let take = {
    let rec loop = (i, xs, acc) =>
      switch (i, xs) {
      | (i, _) if i <= 0 => acc
      | (_, list{}) => acc
      | (i, list{a, ...b}) => loop(i - 1, b, append(a, acc))
      }
    (i, xs) => loop(i, xs, list{})
  }
  let takeLast = (i, xs) => List.rev(xs) |> take(i) |> List.rev

  let splitAt = (i, xs) => (take(i, xs), takeLast(List.length(xs) - i, xs))
  let remove = (i, n, xs) => {
    let (a, b) = splitAt(i, xs)
    \"@"(a, drop(n, b))
  }

  let find = List.find
  let filter = List.filter
  let for_all = List.for_all
  let exists = List.exists
  let sort = List.sort
  let length = List.length

  let filter_opt = xs => {
    let rec loop = (l, acc) =>
      switch l {
      | list{} => acc
      | list{hd, ...tl} =>
        switch hd {
        | None => loop(tl, acc)
        | Some(x) => loop(tl, list{x, ...acc})
        }
      }
    List.rev(loop(xs, list{}))
  }

  let containsWith = f => List.exists(f)

  let uniqWithBy = (eq, f, xs) =>
    List.fold_left(
      ((acc, tacc), v) =>
        containsWith(eq(f(v)), tacc) ? (acc, tacc) : (append(v, acc), append(f(v), tacc)),
      (list{}, list{}),
      xs,
    ) |> fst

  let uniqBy = (f, xs) => uniqWithBy(Util.eq, f, xs)
  let join = j => List.fold_left((acc, v) => String.length(acc) == 0 ? v : acc ++ (j ++ v), "")

  let head = xs =>
    switch List.hd(xs) {
    | exception _ => None
    | a => Some(a)
    }

  let uniq = xs => uniqBy(x => x, xs)
  let flatten = List.flatten
  let last = xs => xs |> List.rev |> head
  let append = List.append
  let getBy = Belt.List.getBy
  let dropLast = (i, xs) => take(List.length(xs) - i, xs)
  let containsWith = f => List.exists(f)
  let contains = x => containsWith(Util.eq(x))

  let reject = pred => List.filter(x => !pred(x))
  let tail = xs =>
    switch List.tl(xs) {
    | exception _ => None
    | a => Some(a)
    }

  let init = xs => {
    O.fmap(List.rev, xs |> List.rev |> tail)
  }

  let singleton = (x: 'a): list<'a> => list{x}

  let adjust = (f, i, xs) => {
    let (a, b) = splitAt(i + 1, xs)
    switch a {
    | _ if i < 0 => xs
    | _ if i >= List.length(xs) => xs
    | list{} => b
    | list{a} => list{f(a), ...b}
    | a =>
      O.fmap(
        concat'(b),
        O.bind(init(a), x =>
          O.fmap(F.flip(append, x), O.fmap(fmap(f), O.fmap(singleton, last(a))))
        ),
      ) |> O.default(xs)
    }
  }

  let without = (exclude, xs) => reject(x => contains(x, exclude), xs)
  let update = (x, i, xs) => adjust(F.always(x), i, xs)
  let iter = List.iter

  let findIndex = {
    let rec loop = (pred, xs, i) =>
      switch xs {
      | list{} => None
      | list{a, ...b} => pred(a) ? Some(i) : loop(pred, b, i + 1)
      }
    (pred, xs) => loop(pred, xs, 0)
  }

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
  let getIndexBy = Belt.Array.getIndexBy
  let last = a => get(a, length(a) - 1)
  let first = get(_, 0)
  let hasBy = (r, fn) => Belt.Array.getBy(r, fn) |> O.isSome
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
      |> Js.Array.filter(O.isSome)
      |> Js.Array.map(O.toExn("Warning: This should not have happened"))
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
    let firstSome = x => Belt.Array.getBy(x, O.isSome)

    let firstSomeFn = (r: array<unit => option<'a>>): option<'a> =>
      O.flatten(getByFmap(r, l => l(), O.isSome))

    let firstSomeFnWithDefault = (r, default) => firstSomeFn(r)->O2.default(default)

    let openIfAllSome = (optionals: array<option<'a>>): option<array<'a>> => {
      if all(O.isSome, optionals) {
        Some(optionals |> fmap(O.toExn("Warning: This should not have happened")))
      } else {
        None
      }
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
      Samples are thought to be discrete if they have any duplicates.
 */
      let _splitContinuousAndDiscreteForDuplicates = (sortedArray: array<float>) => {
        let continuous: array<float> = []
        let discrete = FloatFloatMap.empty()
        Belt.Array.forEachWithIndex(sortedArray, (index, element) => {
          let maxIndex = (sortedArray |> Array.length) - 1
          let possiblySimilarElements = switch index {
          | 0 => [index + 1]
          | n if n == maxIndex => [index - 1]
          | _ => [index - 1, index + 1]
          } |> Belt.Array.map(_, r => sortedArray[r])
          let hasSimilarElement = Belt.Array.some(possiblySimilarElements, r => r == element)
          hasSimilarElement
            ? FloatFloatMap.increment(element, discrete)
            : {
                let _ = Js.Array.push(element, continuous)
              }

          ()
        })

        (continuous, discrete)
      }

      /*
      This function works very similarly to splitContinuousAndDiscreteForDuplicates. The one major difference
      is that you can specify a minDiscreteWeight.  If the min discreet weight is 4, that would mean that
      at least four elements needed from a specific value for that to be kept as discrete. This is important
      because in some cases, we can expect that some common elements will be generated by regular operations.
      The final continous array will be sorted.
 */
      let splitContinuousAndDiscreteForMinWeight = (
        sortedArray: array<float>,
        ~minDiscreteWeight: int,
      ) => {
        let (continuous, discrete) = _splitContinuousAndDiscreteForDuplicates(sortedArray)
        let keepFn = v => Belt.Float.toInt(v) >= minDiscreteWeight
        let (discreteToKeep, discreteToIntegrate) = FloatFloatMap.partition(
          ((_, v)) => keepFn(v),
          discrete,
        )
        let newContinousSamples =
          discreteToIntegrate->FloatFloatMap.toArray
          |> fmap(((k, v)) => Belt.Array.makeBy(Belt.Float.toInt(v), _ => k))
          |> Belt.Array.concatMany
        let newContinuous = concat(continuous, newContinousSamples)
        newContinuous |> Array.fast_sort(floatCompare)
        (newContinuous, discreteToKeep)
      }
    }
  }
  module Sorted = Floats.Sorted
}

module A2 = {
  let fmap = (a, b) => A.fmap(b, a)
  let fmapi = (a, b) => A.fmapi(b, a)
  let joinWith = (a, b) => A.joinWith(b, a)
  let filter = (a, b) => A.filter(b, a)
}

module JsArray = {
  let concatSomes = (optionals: Js.Array.t<option<'a>>): Js.Array.t<'a> =>
    optionals
    |> Js.Array.filter(O.isSome)
    |> Js.Array.map(O.toExn("Warning: This should not have happened"))
  let filter = Js.Array.filter
}

module Dict = {
  type t<'a> = Js.Dict.t<'a>
  let get = Js.Dict.get
  let keys = Js.Dict.keys
  let fromArray = Js.Dict.fromArray
  let toArray = Js.Dict.entries
  let concat = (a, b) => A.concat(toArray(a), toArray(b))->fromArray
  let concatMany = ts => ts->A2.fmap(toArray)->A.concatMany->fromArray
}
