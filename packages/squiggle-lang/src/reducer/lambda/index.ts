import uniq from "lodash/uniq.js";

import { LocationRange } from "../../ast/types.js";
import { TTypedLambda } from "../../types/TTypedLambda.js";
import { sort } from "../../utility/E_A_Floats.js";
import { Value } from "../../value/index.js";
import { Reducer } from "../Reducer.js";
import { BuiltinLambda } from "./BuiltinLambda.js";
import { UserDefinedLambda } from "./UserDefinedLambda.js";

export abstract class BaseLambda {
  isDecorator: boolean = false;
  captures: Value[] = []; // used only on user-defined lambdas, but useful for all lambdas for faster lookups

  abstract readonly type: string;
  abstract display(): string;
  abstract toString(): string;

  abstract signatures(): TTypedLambda[];
  abstract parameterString(): string;

  // Call the lambda's body with given args.
  // Implementation is responsible for extending and popping the frame stack.
  //
  // Frame stack should be popped only if the lambda body completes
  // successfully; if the lambda throws while evaluating its body, the frame of
  // this lambda should be left on the frame stack.
  //
  // Note: it's hard to reuse the common code between UserDefinedLambda and
  // BuiltinLambda here, because UserDefinedLambda checks its arguments _before_
  // it pushes the frame on frame stack.
  abstract call(
    args: Value[],
    reducer: Reducer,
    location?: LocationRange
  ): Value;

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
