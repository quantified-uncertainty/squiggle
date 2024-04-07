import { Lambda } from "../reducer/lambda.js";
import { BaseValue } from "./BaseValue.js";
import { Value, vLambda } from "./index.js";
import { SerializationStorage } from "./serialize.js";

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
    storage: SerializationStorage
  ): SerializedSpecification {
    return {
      name: this.value.name,
      documentation: this.value.documentation,
      validateId: storage.serializeValue(vLambda(this.value.validate)),
    };
  }

  static deserialize(
    payload: SerializedSpecification,
    load: (id: number) => Value
  ): VSpecification {
    const validate = load(payload.validateId);
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
