import { Lambda } from "../reducer/lambda.js";
import { BaseValue } from "./BaseValue.js";

export type Specification = {
  title: string;
  validate: Lambda;
  description?: string;
  showAs?: Lambda;
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
    return (
      this.value.title === other.value.title &&
      this.value.description === other.value.description
    );
  }
}

export const vSpecification = (v: Specification) => new VSpecification(v);
