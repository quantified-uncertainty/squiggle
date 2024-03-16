import { ErrorMessage } from "../errors/messages.js";

export type result<V, E> =
  | {
      ok: true;
      value: V;
    }
  | { ok: false; value: E };

export function Ok<T, E>(value: T): result<T, E> {
  return { ok: true, value: value };
}

export function Err<T, E>(value: E): result<T, E> {
  return { ok: false, value: value };
}

export function fmap<T, T2, E>(
  r: result<T, E>,
  fn: (v: T) => T2
): result<T2, E> {
  if (r.ok) {
    return Ok(fn(r.value));
  } else {
    return r;
  }
}

export function fmap2<T, T2, E, E2>(
  r: result<T, E>,
  fn1: (v: T) => T2,
  fn2: (v: E) => E2
): result<T2, E2> {
  if (r.ok) {
    return Ok(fn1(r.value));
  } else {
    return Err(fn2(r.value));
  }
}

export function errMap<T, E, E2>(
  r: result<T, E>,
  fn: (v: E) => E2
): result<T, E2> {
  if (r.ok) {
    return r;
  } else {
    return Err(fn(r.value));
  }
}

export function bind<T, T2, E>(
  r: result<T, E>,
  fn: (v: T) => result<T2, E>
): result<T2, E> {
  if (r.ok) {
    return fn(r.value);
  } else {
    return r;
  }
}

export function merge<T1, T2, E>(
  a: result<T1, E>,
  b: result<T2, E>
): result<[T1, T2], E> {
  if (!a.ok) {
    return a;
  }
  if (!b.ok) {
    return b;
  }
  return Ok([a.value, b.value]);
}

export function mergeMany<T, E>(results: result<T, E>[]): result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (result.ok) {
      values.push(result.value);
    } else {
      return Err(result.value);
    }
  }
  return Ok(values);
}

export function getError<T, E>(r: result<T, E>): E | undefined {
  if (!r.ok) {
    return r.value;
  } else {
    return undefined;
  }
}

export function getExt<T, E>(r: result<T, E>): T {
  if (r.ok) {
    return r.value;
  } else {
    throw r.value;
  }
}

export function getOrThrow<T, E>(
  r: result<T, E>,
  errMap: (e: E) => ErrorMessage
): T {
  if (!r.ok) {
    throw errMap(r.value);
  } else {
    return r.value;
  }
}

export class Result<T, E> {
  private constructor(
    public readonly ok: boolean,
    public readonly value: T | E
  ) {}

  static ok<T, E>(value: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  static err<T, E>(value: E): Result<T, E> {
    return new Result<T, E>(false, value);
  }

  static fromType<T, E>(r: result<T, E>): Result<T, E> {
    return new Result<T, E>(r.ok, r.value);
  }

  toType: () => result<T, E> = () => {
    if (this.ok) {
      return Ok(this.value as T);
    } else {
      return Err(this.value as E);
    }
  };

  merge<T2, E2>(r: Result<T2, E2>): Result<[T, T2], E | E2> {
    if (this.ok) {
      if (r.ok) {
        return Result.ok([this.value as T, r.value as T2]);
      } else {
        return Result.err(r.value as E2);
      }
    } else {
      return Result.err(this.value as E);
    }
  }

  fmap<U>(fn: (value: T) => U): Result<U, E> {
    if (this.ok) {
      return Result.ok(fn(this.value as T));
    } else {
      return Result.err(this.value as E);
    }
  }

  errMap<E2>(fn: (value: E) => E2): Result<T, E2> {
    if (this.ok) {
      return Result.ok(this.value as T);
    } else {
      return Result.err(fn(this.value as E));
    }
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.ok) {
      return fn(this.value as T);
    } else {
      return Result.err(this.value as E);
    }
  }

  getOrThrow(errMap: (value: E) => ErrorMessage): T {
    if (this.ok) {
      return this.value as T;
    } else {
      throw errMap(this.value as E);
    }
  }
}
