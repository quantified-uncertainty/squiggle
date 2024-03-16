import { ErrorMessage } from "../errors/messages.js";
import { Err, Ok, result } from "./result.js";

// Call it "ResultC", to distinguish it from the "result" type. Later we want to rename the "result" type to "Result".
export class ResultC<T, E> {
  private constructor(
    public readonly ok: boolean,
    public readonly value: T | E
  ) {}

  static ok<T, E>(value: T): ResultC<T, E> {
    return new ResultC<T, E>(true, value);
  }

  static err<T, E>(value: E): ResultC<T, E> {
    return new ResultC<T, E>(false, value);
  }

  static fromType<T, E>(r: result<T, E>): ResultC<T, E> {
    return new ResultC<T, E>(r.ok, r.value);
  }

  toType: () => result<T, E> = () => {
    if (this.ok) {
      return Ok(this.value as T);
    } else {
      return Err(this.value as E);
    }
  };

  merge<T2, E2>(r: ResultC<T2, E2>): ResultC<[T, T2], E | E2> {
    if (this.ok) {
      if (r.ok) {
        return ResultC.ok([this.value as T, r.value as T2]);
      } else {
        return ResultC.err(r.value as E2);
      }
    } else {
      return ResultC.err(this.value as E);
    }
  }

  fmap<U>(fn: (value: T) => U): ResultC<U, E> {
    if (this.ok) {
      return ResultC.ok(fn(this.value as T));
    } else {
      return ResultC.err(this.value as E);
    }
  }

  errMap<E2>(fn: (value: E) => E2): ResultC<T, E2> {
    if (this.ok) {
      return ResultC.ok(this.value as T);
    } else {
      return ResultC.err(fn(this.value as E));
    }
  }

  flatMap<U>(fn: (value: T) => ResultC<U, E>): ResultC<U, E> {
    if (this.ok) {
      return fn(this.value as T);
    } else {
      return ResultC.err(this.value as E);
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
