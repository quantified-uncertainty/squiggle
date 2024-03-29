import { Lambda } from "../reducer/lambda.js";
import { BaseValue } from "./BaseValue.js";

export type Specification = {
  name: string;
  documentation: string;
  validate: Lambda;
};

export class VSpecification extends BaseValue {
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
}

export const vSpecification = (v: Specification) => new VSpecification(v);
