import { REOther } from "../errors/messages.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { Value } from "../value/index.js";

type StackEntry = {
  name: string;
  value: Value;
};

export type Bindings = ImmutableMap<string, Value>;

/*
 * Offsets on stack are resolved in `expression/fromAst.ts`, except for stdLib symbols, which are resolved in runtime.
 */
export class Stack {
  private constructor(private stack: StackEntry[] = []) {}

  static make(): Stack {
    return new Stack();
  }

  outOfBounds(): never {
    throw new REOther("Internal error: out of bounds stack index");
  }

  get(offset: number): Value {
    const size = this.stack.length;
    const pos = size - 1 - offset;
    if (pos < 0) {
      this.outOfBounds();
    }
    const result = this.stack.at(pos);
    if (!result) {
      this.outOfBounds();
    }
    return result.value;
  }

  push(name: string, value: Value): Stack {
    return new Stack([...this.stack, { name, value }]);
  }

  asBindings(): Bindings {
    return ImmutableMap(this.stack.map((entry) => [entry.name, entry.value]));
  }
}
