/* O for option */
open Rationale.Function.Infix;

/* Utils */
module U = {
  let isEqual = (a, b) => a == b;
  let toA = a => [|a|];
  let id = e => e;
};

module O = {
  let dimap = (sFn, rFn, e) =>
    switch (e) {
    | Some(r) => sFn(r)
    | None => rFn()
    };
  ();
  let fmap = Rationale.Option.fmap;
  let bind = Rationale.Option.bind;
  let default = Rationale.Option.default;
  let isSome = Rationale.Option.isSome;
  let toExn = Rationale.Option.toExn;
  let some = Rationale.Option.some;
  let flatApply = (fn, b) =>
    Rationale.Option.apply(fn, Some(b)) |> Rationale.Option.flatten;

  let toResult = (error, e) =>
    switch (e) {
    | Some(r) => Belt.Result.Ok(r)
    | None => Error(error)
    };

  module React = {
    let defaultNull = default(ReasonReact.null);
    let fmapOrNull = fn => fmap(fn) ||> default(ReasonReact.null);
    let flatten = default(ReasonReact.null);
  };
};

module Bool = {
  type t = bool;
  let toString = (t: t) => t ? "TRUE" : "FALSE";
  let fromString = str => str == "TRUE" ? true : false;
};

module Float = {
  let toString = Js.Float.toFixed;
  let with3DigitsPrecision = Js.Float.toPrecisionWithPrecision(_, ~digits=3);
};

module I = {
  let increment = n => n + 1;
  let decrement = n => n - 1;
};

let safe_fn_of_string = (fn, s: string): option('a) =>
  try(Some(fn(s))) {
  | _ => None
  };

module S = {
  let toReact = ReasonReact.string;
  let safe_float = float_of_string->safe_fn_of_string;
  let safe_int = int_of_string->safe_fn_of_string;
};

module JsDate = {
  let fromString = Js.Date.fromString;
  let now = Js.Date.now;
  let make = Js.Date.make;
  let valueOf = Js.Date.valueOf;
};

/* List */
module L = {
  let fmap = List.map;
  let toArray = Array.of_list;
  let fmapi = List.mapi;
  let concat = List.concat;
  let find = List.find;
  let filter = List.filter;
  let for_all = List.for_all;
  let exists = List.exists;
  let sort = List.sort;
  let length = List.length;
  let filter_opt = Rationale.RList.filter_opt;
  let uniqBy = Rationale.RList.uniqBy;
  let join = Rationale.RList.join;
  let head = Rationale.RList.head;
  let uniq = Rationale.RList.uniq;
  let flatten = List.flatten;
  let last = Rationale.RList.last;
  let append = List.append;
  let getBy = Belt.List.getBy;
  let dropLast = Rationale.RList.dropLast;
  let contains = Rationale.RList.contains;
  let without = Rationale.RList.without;
  let update = Rationale.RList.update;
  let iter = List.iter;
  let findIndex = Rationale.RList.findIndex;
  let withIdx = xs =>
    xs
    |> Rationale.RList.zip(
         Rationale.RList.times(Rationale.Function.identity, length(xs)),
       );
  module React = {
    let fmap = (f, xs) => xs |> fmap(f) |> toArray |> React.array;
    let fmapi = (f, xs) => xs |> fmapi(f) |> toArray |> React.array;
  };
};

/* A for Array */
module A = {
  let fmap: ('a => 'b, array('a)) => array('b) = Array.map;
  let fmapi = Array.mapi;
  let to_list = Array.to_list;
  let of_list = Array.of_list;
  let length = Array.length;
  let append = Array.append;
  //  let empty = [||];
  let unsafe_get = Array.unsafe_get;
  let get = Belt.Array.get;
  let fold_left = Array.fold_left;
  let fold_right = Array.fold_right;
  let concatMany = Belt.Array.concatMany;
  let keepMap = Belt.Array.keepMap;
  let stableSortBy = Belt.SortArray.stableSortBy;
  /* TODO: Is there a better way of doing this? */

  /* TODO: Is -1 still the indicator that this is false (as is true with js findIndex)? Wasn't sure. */
  let findIndex = (e, i) =>
    Js.Array.findIndex(e, i)
    |> (
      r =>
        switch (r) {
        | (-1) => None
        | r => Some(r)
        }
    );
  let filter = (o, e) => Js.Array.filter(o, e);
  module O = {
    let concatSomes = (optionals: Js.Array.t(option('a))): Js.Array.t('a) =>
      optionals
      |> Js.Array.filter(Rationale.Option.isSome)
      |> Js.Array.map(
           Rationale.Option.toExn("Warning: This should not have happened"),
         );
    let concatSome = (optionals: array(option('a))): array('a) =>
      optionals
      |> Js.Array.filter(Rationale.Option.isSome)
      |> Js.Array.map(
           Rationale.Option.toExn("Warning: This should not have happened"),
         );
    let defaultEmpty = (o: option(array('a))): array('a) =>
      switch (o) {
      | Some(o) => o
      | None => [||]
      };
  };
};

module JsArray = {
  let concatSomes = (optionals: Js.Array.t(option('a))): Js.Array.t('a) =>
    optionals
    |> Js.Array.filter(Rationale.Option.isSome)
    |> Js.Array.map(
         Rationale.Option.toExn("Warning: This should not have happened"),
       );
  let filter = Js.Array.filter;
};

module FloatArray = {
  let min = r => r |> A.fold_left((a, b) => a < b ? a : b, max_float);
  let max = r => r |> A.fold_left((a, b) => a > b ? a : b, min_float);
};