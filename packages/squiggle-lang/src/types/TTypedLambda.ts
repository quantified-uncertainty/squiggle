import { fnInputsMatchesLengths } from "../library/registry/helpers.js";
import { FnInput } from "../reducer/lambda/FnInput.js";
import { Lambda } from "../reducer/lambda/index.js";
import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Err, Ok, result } from "../utility/result.js";
import { Value, vLambda } from "../value/index.js";
import { InputType } from "../value/VInput.js";
import { typeCanBeAssigned } from "./helpers.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export type InferredOutputType =
  | {
      kind: "ok";
      type: Type;
      // TODO - list all compatible signatures; then we can use the filtered list in the reducer for better performance
    }
  | {
      kind: "arity";
      arity: number[]; // list of possible arities, see REArityError
    }
  | {
      // arity is ok but types are not compatible
      kind: "no-match";
    };

export class TTypedLambda extends Type {
  minInputs: number;
  maxInputs: number;

  constructor(
    public inputs: FnInput[],
    public output: Type
  ) {
    super();

    // Make sure that there are no non-optional inputs after optional inputs:
    {
      let optionalFound = false;
      for (const input of this.inputs) {
        if (optionalFound && !input.optional) {
          throw new Error(
            `Optional inputs must be last. Found non-optional input after optional input. ${inputs}`
          );
        }
        if (input.optional) {
          optionalFound = true;
        }
      }
    }

    this.minInputs = this.inputs.filter((t) => !t.optional).length;
    this.maxInputs = this.inputs.length;
  }

  check(v: Value): boolean {
    return this.unpack(v) !== undefined;
  }

  unpack(v: Value) {
    return v.type === "Lambda" &&
      fnInputsMatchesLengths(this.inputs, v.value.parameterCounts())
      ? v.value
      : undefined;
  }

  pack(v: Lambda) {
    return vLambda(v);
  }

  serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return {
      kind: "TypedLambda",
      inputs: this.inputs.map((input) => visit.input(input)),
      output: visit.type(this.output),
    };
  }

  toString() {
    return `(${this.inputs.map((i) => i.toString()).join(", ")}) => ${this.output}`;
  }

  override defaultFormInputCode() {
    return `{|${this.inputs.map((_, index) => `x${index}`).join(", ")}| ${this.output.defaultFormInputCode()} }`;
  }

  override defaultFormInputType(): InputType {
    return "textArea";
  }

  // Lambda-specific methods
  validateArgs(args: Value[]): result<
    Value[],
    | {
        kind: "arity";
      }
    | {
        kind: "domain";
        position: number;
      }
  > {
    const argsLength = args.length;
    const parametersLength = this.inputs.length;

    // TODO - we could check against minInputs/maxInputs, but user-defined
    // functions don't support optional parameters yet, so it's not important.
    if (argsLength !== this.inputs.length) {
      return Err({
        kind: "arity",
      });
    }

    for (let i = 0; i < parametersLength; i++) {
      const type = this.inputs[i].type;
      if (!type.check(args[i])) {
        return Err({
          kind: "domain",
          position: i,
        });
      }
    }
    return Ok(args);
  }

  inferOutputType(argTypes: Type[]): InferredOutputType {
    if (argTypes.length < this.minInputs || argTypes.length > this.maxInputs) {
      // args length mismatch
      const arity: number[] = [];
      for (let i = this.minInputs; i <= this.maxInputs; i++) {
        arity.push(i);
      }
      return {
        kind: "arity",
        arity,
      };
    }

    for (let i = 0; i < argTypes.length; i++) {
      if (!typeCanBeAssigned(this.inputs[i].type, argTypes[i])) {
        return {
          kind: "no-match",
        };
      }
    }
    return {
      kind: "ok",
      type: this.output,
    };
  }
}

export function tTypedLambda(inputs: FnInput[], output: Type) {
  return new TTypedLambda(inputs, output);
}
