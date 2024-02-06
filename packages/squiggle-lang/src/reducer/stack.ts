import { REOther } from "../errors/messages.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { Value } from "../value/index.js";

export type Bindings = ImmutableMap<string, Value>;

/*
 * Offsets on stack are resolved in `expression/fromAst.ts`, except for stdLib symbols, which are resolved in runtime.
 */
export class Stack {
  private constructor(private stack: Value[] = []) {}

  static make(): Stack {
    return new Stack();
  }

  outOfBounds(): never {
    throw new REOther("Internal error: out of bounds stack index");
  }

  get(offset: number): Value {
    if (offset < 0) {
      this.outOfBounds();
    }
    const result = this.stack.at(-offset - 1);
    if (!result) {
      this.outOfBounds();
    }
    return result;
  }

  push(value: Value) {
    this.stack.push(value);
  }

  size() {
    return this.stack.length;
  }

  shrink(newSize: number) {
    if (newSize > this.stack.length) {
      throw new Error("Internal error: can't expand a stack with .shrink()");
    }
    this.stack.length = newSize;
  }
}
