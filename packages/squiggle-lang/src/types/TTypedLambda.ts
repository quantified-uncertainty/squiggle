import {
  InputOrType,
  inputOrTypeToInput,
} from "../library/registry/fnDefinition.js";
import { FnInput } from "../library/registry/fnInput.js";
import { fnInputsMatchesLengths } from "../library/registry/helpers.js";
import { Lambda } from "../reducer/lambda.js";
import { Value, vLambda } from "../value/index.js";
import { InputType } from "../value/VInput.js";
import { Type } from "./Type.js";

export class TTypedLambda extends Type<Lambda> {
  public inputs: FnInput<Type<unknown>>[];

  constructor(
    maybeInputs: InputOrType<any>[],
    public output: Type<any>
  ) {
    super();
    this.inputs = maybeInputs.map(inputOrTypeToInput);
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
