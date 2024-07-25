import jstat from "jstat";

import { LocationRange } from "../ast/types.js";
import { IR, IRByKind } from "../compiler/types.js";
import { Env } from "../dists/env.js";
import { IRuntimeError } from "../errors/IError.js";
import {
  ErrorMessage,
  REArgumentDomainError,
  REExpectedType,
  RENotADecorator,
  RENotAFunction,
  REOther,
} from "../errors/messages.js";
import { getAleaRng, PRNG } from "../rng/index.js";
import { ImmutableMap } from "../utility/immutable.js";
import { annotationToDomain } from "../value/annotations.js";
import { Value, vArray, vDict, vLambda, vVoid } from "../value/index.js";
import { vDomain, VDomain } from "../value/VDomain.js";
import { FrameStack } from "./FrameStack.js";
import {
  Lambda,
  UserDefinedLambda,
  UserDefinedLambdaParameter,
} from "./lambda.js";
import { RunProfile } from "./RunProfile.js";
import { Stack } from "./Stack.js";
import { StackTrace } from "./StackTrace.js";

type IRValue<Kind extends IR["kind"]> = IRByKind<Kind>["value"];

/**
 * Checks that all `evaluateFoo` methods follow the same naming convention.
 *
 * Note: unfortunately, it's not possible to reuse method signatures. Don't try
 * `evaluateFoo: EvalutateAllKinds["Foo"] = () => ...`, it's a bad idea because
 * arrow functions shouldn't be used as methods.
 */
type EvaluateAllKinds = {
  [Kind in IR["kind"] as `evaluate${Kind}`]: (
    irValue: IRValue<Kind>,
    location: LocationRange
  ) => Value;
};

export class Reducer implements EvaluateAllKinds {
  readonly environment: Readonly<Env>;

  readonly stack: Stack;
  readonly frameStack: FrameStack;

  readonly rng: PRNG;

  private isRunning: boolean = false;
  profile: RunProfile | undefined;

  constructor(environment: Env) {
    this.environment = {
      ...environment,
      // environment is heavily used so we want it to be monomorphic
      // (I haven't benchmarked this though)
      profile: environment.profile ?? false,
    };

    this.stack = Stack.make();
    this.frameStack = FrameStack.make();

    const seed = environment.seed
      ? String(environment.seed)
      : String(Math.random());

    this.rng = getAleaRng(seed);
  }

  // Evaluate the IR.
  // When recursing into nested IR nodes, call `innerEvaluate()` instead of this method.
  evaluate(ir: IR): Value {
    if (this.isRunning) {
      throw new Error(
        "Can't recursively reenter the reducer, consider `.innerEvaluate()` if you're working on Squiggle internals"
      );
    }
    jstat.setRandom(this.rng); // TODO - roll back at the end

    this.isRunning = true;

    // avoid stale data
    if (this.environment.profile) {
      this.profile = new RunProfile(ir.location.source);
    } else {
      this.profile = undefined;
    }

    const result = this.innerEvaluate(ir);
    this.isRunning = false;

    return result;
  }

  innerEvaluate(ir: IR): Value {
    let start: Date | undefined;
    if (this.profile) {
      start = new Date();
    }

    let result: Value;
    switch (ir.kind) {
      case "Call":
        result = this.evaluateCall(ir.value, ir.location);
        break;
      case "StackRef":
        result = this.evaluateStackRef(ir.value);
        break;
      case "CaptureRef":
        result = this.evaluateCaptureRef(ir.value);
        break;
      case "Block":
        result = this.evaluateBlock(ir.value);
        break;
      case "Assign":
        result = this.evaluateAssign(ir.value);
        break;
      case "Array":
        result = this.evaluateArray(ir.value);
        break;
      case "Dict":
        result = this.evaluateDict(ir.value);
        break;
      case "Value":
        result = this.evaluateValue(ir.value);
        break;
      case "Ternary":
        result = this.evaluateTernary(ir.value);
        break;
      case "Lambda":
        result = this.evaluateLambda(ir.value);
        break;
      case "Program":
        result = this.evaluateProgram(ir.value);
        break;
      default:
        throw new Error(`Unreachable: ${ir satisfies never}`);
    }
    if (
      this.profile &&
      // TODO - exclude other trivial IR nodes?
      ir.kind !== "Program"
    ) {
      const end = new Date();
      const time = end.getTime() - start!.getTime();
      this.profile.addRange(ir.location, time);
    }
    return result;
  }

  // This method is mostly useful in the reducer code.
  // In Stdlib, it's fine to throw ErrorMessage instances, they'll be upgraded to errors with stack traces automatically.
  private runtimeError(error: ErrorMessage, location: LocationRange) {
    return IRuntimeError.fromMessage(
      error,
      StackTrace.make(this.frameStack, location)
    );
  }

  // This method is useful if you called `reducer.evaluate` and got an exception.
  // The exception will be annotated with the current frameStack, even if it occured somewhere in JS.
  // You can also attach an optional location to the stacktrace.
  errorFromException(e: unknown, location?: LocationRange) {
    return IRuntimeError.fromException(
      e,
      StackTrace.make(this.frameStack, location)
    );
  }

  evaluateBlock(irValue: IRValue<"Block">) {
    const initialStackSize = this.stack.size();

    for (const statement of irValue.statements) {
      this.innerEvaluate(statement);
    }

    const result = this.innerEvaluate(irValue.result);
    this.stack.shrink(initialStackSize);

    return result;
  }

  evaluateProgram(irValue: IRValue<"Program">) {
    // Same as Block, but doesn't shrink back the stack, so that we could return bindings and exports from it.
    for (const statement of irValue.statements) {
      this.innerEvaluate(statement);
    }

    if (irValue.result) {
      return this.innerEvaluate(irValue.result);
    } else {
      return vVoid();
    }
  }

  evaluateArray(irValue: IRValue<"Array">) {
    const values = irValue.map((element) => {
      return this.innerEvaluate(element);
    });
    return vArray(values);
  }

  evaluateDict(irValue: IRValue<"Dict">) {
    return vDict(
      ImmutableMap(
        irValue.map(([eKey, eValue]) => {
          const key = this.innerEvaluate(eKey);
          if (key.type !== "String") {
            throw this.runtimeError(
              new REOther("Dict keys must be strings"),
              eKey.location
            );
          }
          const keyString: string = key.value;
          const value = this.innerEvaluate(eValue);
          return [keyString, value];
        })
      )
    );
  }

  evaluateAssign(irValue: IRValue<"Assign">) {
    const result = this.innerEvaluate(irValue.right);
    this.stack.push(result);
    return vVoid();
  }

  evaluateStackRef(irValue: IRValue<"StackRef">) {
    return this.stack.get(irValue);
  }

  private getCapture(id: number) {
    // This might seem relatively slow, but it works faster than when we stored captures in the Reducer object.
    const topFrame = this.frameStack.getTopFrame();
    if (!topFrame) {
      throw new Error(
        `Internal error: can't reference a capture when not in a function`
      );
    }
    const value = topFrame.lambda.captures.at(id);
    if (!value) {
      throw new Error(`Internal error: invalid capture id ${id}`);
    }
    return value;
  }

  evaluateCaptureRef(id: IRValue<"CaptureRef">) {
    return this.getCapture(id);
  }

  evaluateValue(value: Value) {
    return value;
  }

  evaluateTernary(irValue: IRValue<"Ternary">) {
    const predicateResult = this.innerEvaluate(irValue.condition);
    if (predicateResult.type !== "Bool") {
      throw this.runtimeError(
        new REExpectedType("Boolean", predicateResult.type),
        irValue.condition.location
      );
    }

    return this.innerEvaluate(
      predicateResult.value ? irValue.ifTrue : irValue.ifFalse
    );
  }

  evaluateLambda(irValue: IRValue<"Lambda">) {
    const parameters: UserDefinedLambdaParameter[] = [];
    for (const parameterIR of irValue.parameters) {
      let domain: VDomain | undefined;
      // Processing annotations, e.g. f(x: [3, 5]) = { ... }
      if (parameterIR.annotation) {
        // First, we evaluate `[3, 5]` expression.
        const annotationValue = this.innerEvaluate(parameterIR.annotation);
        // Now we cast it to domain value, e.g. `NumericRangeDomain(3, 5)`.
        // Casting can fail, in which case we throw the error with a correct stacktrace.
        try {
          domain = vDomain(annotationToDomain(annotationValue));
        } catch (e) {
          // see also: `Lambda.callFrom`
          throw this.errorFromException(e, parameterIR.annotation.location);
        }
      }
      parameters.push({
        name: parameterIR.name,
        domain,
      });
    }

    const capturedValues: Value[] = [];
    for (const capture of irValue.captures) {
      // identical to `evaluateStackRef` and `evaluateCaptureRef`
      switch (capture.kind) {
        case "StackRef": {
          capturedValues.push(this.stack.get(capture.value));
          break;
        }
        case "CaptureRef": {
          capturedValues.push(this.getCapture(capture.value));
          break;
        }
        default:
          throw new Error(`Impossible capture ${capture satisfies never}`);
      }
    }

    return vLambda(
      new UserDefinedLambda(
        irValue.name,
        capturedValues,
        parameters,
        irValue.body
      )
    );
  }

  evaluateCall(irValue: IRValue<"Call">, location: LocationRange) {
    const lambda = this.innerEvaluate(irValue.fn);
    if (lambda.type !== "Lambda") {
      throw this.runtimeError(
        new RENotAFunction(lambda.toString()),
        irValue.fn.location
      );
    }
    if (irValue.as === "decorate" && !lambda.value.isDecorator) {
      throw this.runtimeError(
        new RENotADecorator(lambda.toString()),
        irValue.fn.location
      );
    }

    const argValues = irValue.args.map((arg) => this.innerEvaluate(arg));

    // We pass the location of a current IR node here, to put it on frameStack.
    try {
      return this.call(lambda.value, argValues, location);
    } catch (e) {
      if (e instanceof REArgumentDomainError) {
        // Function is still on frame stack, remove it.
        // (This is tightly coupled with lambda implementations.)
        this.frameStack.pop();
        throw this.runtimeError(
          e,
          irValue.args.at(e.idx)?.location ?? location
        );
      } else {
        throw e;
      }
    }
  }

  call(lambda: Lambda, args: Value[], location?: LocationRange) {
    return lambda.call(args, this, location);
  }
}
