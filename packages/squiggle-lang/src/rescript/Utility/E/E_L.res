/* List */
module F = E_F
module O = E_O

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
      O.bind(init(a), x => O.fmap(F.flip(append, x), O.fmap(fmap(f), O.fmap(singleton, last(a))))),
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
