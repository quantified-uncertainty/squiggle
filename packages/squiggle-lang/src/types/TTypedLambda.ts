import { fnInputsMatchesLengths } from "../library/registry/helpers.js";
import {
  InputOrType,
  inputOrTypeToInput,
} from "../reducer/lambda/FnDefinition.js";
import { FnInput } from "../reducer/lambda/FnInput.js";
import { Lambda } from "../reducer/lambda/index.js";
import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value, vLambda } from "../value/index.js";
import { InputType } from "../value/VInput.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export class TTypedLambda extends Type<Lambda> {
  public inputs: FnInput<unknown>[];

  constructor(
    maybeInputs: InputOrType<unknown>[],
    public output: Type
  ) {
    super();
    this.inputs = maybeInputs.map(inputOrTypeToInput);
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
}

// TODO - consistent naming
export function tTypedLambda(inputs: InputOrType<unknown>[], output: Type) {
  return new TTypedLambda(inputs, output);
}
