import { Type } from "../../types/Type.js";
import { FnInput } from "./FnInput.js";

export class FnSignature<
  InputTypes extends FnInput<Type<any>>[],
  OutputType extends Type<any>,
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
