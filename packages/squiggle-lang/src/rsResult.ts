// Temporary; to be removed after Rescript conversion is done.

import { A } from "./rescript/Utility/E.bs";

export enum E {
  Ok = 0,
  Error = 1,
}

export type rsResult<V, E> =
  | {
      TAG: E.Ok;
      _0: V;
    }
  | { TAG: E.Error; _0: E };

// shortcut
export type t<V, E> = rsResult<V, E>;

export function Ok<T, E>(value: T): rsResult<T, E> {
  return { TAG: E.Ok, _0: value };
}

export function Error<T, E>(value: E): rsResult<T, E> {
  return { TAG: E.Error, _0: value };
}

export function fmap<T, T2, E>(
  r: rsResult<T, E>,
  fn: (v: T) => T2
): rsResult<T2, E> {
  if (r.TAG === E.Ok) {
    return Ok(fn(r._0));
  } else {
    return r;
  }
}

export function errMap<T, E, E2>(
  r: rsResult<T, E>,
  fn: (v: E) => E2
): rsResult<T, E2> {
  if (r.TAG === E.Ok) {
    return r;
  } else {
    return Error(fn(r._0));
  }
}

export function bind<T, T2, E>(
  r: rsResult<T, E>,
  fn: (v: T) => rsResult<T2, E>
): rsResult<T2, E> {
  if (r.TAG === E.Ok) {
    return fn(r._0);
  } else {
    return r;
  }
}

export function merge<T1, T2, E>(
  a: rsResult<T1, E>,
  b: rsResult<T2, E>
): rsResult<[T1, T2], E> {
  if (a.TAG === E.Error) {
    return a;
  }
  if (b.TAG === E.Error) {
    return b;
  }
  return Ok([a._0, b._0]);
}

export function getError<T, E>(r: rsResult<T, E>): E | undefined {
  if (r.TAG === E.Error) {
    return r._0;
  } else {
    return undefined;
  }
}
