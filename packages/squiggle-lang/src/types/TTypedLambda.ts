import { fnInputsMatchesLengths } from "../library/registry/helpers.js";
import {
  InputOrType,
  inputOrTypeToInput,
} from "../reducer/lambda/FnDefinition.js";
import { FnInput } from "../reducer/lambda/FnInput.js";
import { Lambda } from "../reducer/lambda/index.js";
import { Value, vLambda } from "../value/index.js";
import { InputType } from "../value/VInput.js";
import { TLambda } from "./TLambda.js";
import { Type } from "./Type.js";

export class TTypedLambda extends TLambda {
  public inputs: FnInput<Type<unknown>>[];

  constructor(
    maybeInputs: InputOrType<any>[],
    public output: Type<any>
  ) {
    super();
    this.inputs = maybeInputs.map(inputOrTypeToInput);
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

  override isSupertype(other: Type<unknown>) {
    return (
      other instanceof TTypedLambda &&
      this.output.isSupertype(other.output) &&
      this.inputs.length === other.inputs.length &&
      // inputs are contravariant
      other.inputs.every((input, index) =>
        input.type.isSupertype(this.inputs[index].type)
      )
    );
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
}

// TODO - consistent naming
export function tLambdaTyped(inputs: InputOrType<any>[], output: Type<any>) {
  return new TTypedLambda(inputs, output);
}
