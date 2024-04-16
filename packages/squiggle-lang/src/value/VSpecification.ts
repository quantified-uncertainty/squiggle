import { Lambda } from "../reducer/lambda.js";
import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../serialization/squiggle.js";
import { BaseValue } from "./BaseValue.js";
import { vLambda } from "./index.js";

export type Specification = {
  name: string;
  documentation: string;
  validate: Lambda;
};

type SerializedSpecification = {
  name: string;
  documentation: string;
  validateId: number;
};

export class VSpecification extends BaseValue<
  "Specification",
  SerializedSpecification
> {
  readonly type = "Specification";

  constructor(public value: Specification) {
    super();
  }

  valueToString() {
    return JSON.stringify(this.value);
  }

  isEqual(other: VSpecification) {
    return this.value === other.value;
  }

  override serializePayload(
    visit: SquiggleSerializationVisitor
  ): SerializedSpecification {
    return {
      name: this.value.name,
      documentation: this.value.documentation,
      validateId: visit.value(vLambda(this.value.validate)),
    };
  }

  static deserialize(
    payload: SerializedSpecification,
    visit: SquiggleDeserializationVisitor
  ): VSpecification {
    const validate = visit.value(payload.validateId);
    if (validate.type !== "Lambda") {
      throw new Error("Expected lambda");
    }

    return new VSpecification({
      name: payload.name,
      documentation: payload.documentation,
      validate: validate.value,
    });
  }
}

export const vSpecification = (v: Specification) => new VSpecification(v);
