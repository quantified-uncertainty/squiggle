import { fnInputsMatchesLengths } from "../library/registry/helpers.js";
import {
  InputOrType,
  inputOrTypeToInput,
} from "../reducer/lambda/FnDefinition.js";
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

export class TTypedLambda extends Type<Lambda> {
  minInputs: number;
  maxInputs: number;

  constructor(
    public inputs: FnInput<unknown>[],
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

  override check(v: Value): boolean {
    return this.unpack(v) !== undefined;
  }

  override unpack(v: Value) {
    return v.type === "Lambda" &&
      fnInputsMatchesLengths(this.inputs, v.value.parameterCounts())
      ? v.value
      : undefined;
  }

  override pack(v: Lambda) {
    return vLambda(v);
  }

  override serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return {
      kind: "TypedLambda",
      inputs: this.inputs.map((input) => visit.input(input)),
      output: visit.type(this.output),
    };
  }

  override display() {
    return `(${this.inputs.map((i) => i.toString()).join(", ")}) => ${this.output.display()}`;
  }

  override defaultFormInputCode() {
    return `{|${this.inputs.map((_, index) => `x${index}`).join(", ")}| ${this.output.defaultFormInputCode()} }`;
  }

  override defaultFormInputType(): InputType {
    return "textArea";
  }

  // Lambda-specific methods
  validateAndUnpackArgs(args: Value[]): unknown[] | undefined {
    if (args.length < this.minInputs || args.length > this.maxInputs) {
      return; // args length mismatch
    }

    const unpackedArgs: any = []; // any, but that's ok, type safety is guaranteed by FnDefinition type
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      const unpackedArg = this.inputs[i].type.unpack(arg);
      if (unpackedArg === undefined) {
        // type mismatch
        return;
      }
      unpackedArgs.push(unpackedArg);
    }

    // Fill in missing optional arguments with nulls.
    // This is important, because empty optionals should be nulls, but without this they would be undefined.
    if (unpackedArgs.length < this.maxInputs) {
      unpackedArgs.push(
        ...Array(this.maxInputs - unpackedArgs.length).fill(null)
      );
    }

    return unpackedArgs;
  }

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

// TODO - consistent naming
export function tTypedLambda(
  maybeInputs: InputOrType<unknown>[],
  output: Type
) {
  const inputs = maybeInputs.map(inputOrTypeToInput);
  return new TTypedLambda(inputs, output);
}
