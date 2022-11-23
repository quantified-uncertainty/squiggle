// Temporary; to be removed after Rescript conversion is done.

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
