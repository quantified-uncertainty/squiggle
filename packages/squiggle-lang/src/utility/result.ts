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
