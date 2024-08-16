import uniq from "lodash/uniq.js";

import { LocationRange } from "../../ast/types.js";
import { sort } from "../../utility/E_A_Floats.js";
import { Value } from "../../value/index.js";
import { Frame } from "../FrameStack.js";
import { Reducer } from "../Reducer.js";
import { BuiltinLambda } from "./BuiltinLambda.js";
import { FnSignature } from "./FnSignature.js";
import { UserDefinedLambda } from "./UserDefinedLambda.js";

export abstract class BaseLambda {
  isDecorator: boolean = false;
  captures: Value[] = []; // used only on user-defined lambdas, but useful for all lambdas for faster lookups

  abstract readonly type: string;
  abstract display(): string;
  abstract toString(): string;

  abstract signatures(): FnSignature[];
  abstract parameterString(): string;

  protected abstract callBody(args: Value[], reducer: Reducer): Value;

  // Prepare a new frame and call the lambda's body with given args.
  call(args: Value[], reducer: Reducer, location?: LocationRange) {
    const initialStackSize = reducer.stack.size();

    reducer.frameStack.extend(new Frame(this, location));

    try {
      const result = this.callBody(args, reducer);
      // If lambda throws an exception, this won't happen.  This is intentional;
      // it allows us to build the correct stacktrace with `.errorFromException`
      // method later.
      reducer.frameStack.pop();
      return result;
    } finally {
      reducer.stack.shrink(initialStackSize);
    }
  }

  parameterCounts() {
    return sort(uniq(this.signatures().map((s) => s.inputs.length)));
  }

  parameterCountString() {
    const counts = this.parameterCounts();
    return (
      counts.slice(0, -1).join(", ") +
      (counts.length > 1 ? " or " : "") +
      counts[counts.length - 1]
    );
  }
}

export type Lambda = UserDefinedLambda | BuiltinLambda;
