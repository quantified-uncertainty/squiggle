import { REDomainError } from "../../errors/messages.js";
import { Type } from "../../types/Type.js";
import { Err, Ok, result } from "../../utility/result.js";
import { Value } from "../../value/index.js";
import { FnInput } from "./FnInput.js";

export class FnSignature<
  InputTypes extends FnInput<any>[] = FnInput<unknown>[],
  OutputType extends Type<any> = Type<unknown>,
> {
  minInputs: number;
  maxInputs: number;

  constructor(
    public inputs: InputTypes,
    public output: OutputType
  ) {
    // Make sure that there are no non-optional inputs after optional inputs:
    {
      let optionalFound = false;
      for (const input of inputs) {
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
        err: unknown;
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
      const input = this.inputs[i];
      if (input.type) {
        const unpacked = input.type.unpack(args[i]);
        if (unpacked === undefined) {
          return Err({
            kind: "domain",
            position: i,
            err: new REDomainError(
              `Parameter ${args[i].valueToString()} must be in domain ${input.type}`
            ),
          });
        }
      }
    }
    return Ok(args);
  }

  inferOutputType(argTypes: Type<any>[]): Type<any> | undefined {
    if (argTypes.length < this.minInputs || argTypes.length > this.maxInputs) {
      return; // args length mismatch
    }

    for (let i = 0; i < argTypes.length; i++) {
      if (!this.inputs[i].type.isSupertype(argTypes[i])) {
        return;
      }
    }
    return this.output;
  }

  toString() {
    const inputs = this.inputs.map((t) => t.toString()).join(", ");
    const output = this.output.display();
    return `(${inputs})${output ? ` => ${output}` : ""}`;
  }
}
