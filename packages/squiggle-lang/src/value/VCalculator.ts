import { REOther } from "../errors/messages.js";
import { Lambda } from "../reducer/lambda.js";
import { BaseValue } from "./BaseValue.js";
import { Value } from "./index.js";
import { Input } from "./VInput.js";

export type Calculator = {
  fn: Lambda;
  inputs: readonly Input[];
  autorun: boolean;
  description?: string;
  title?: string;
  sampleCount?: number;
};

type SerializedCalculator = unknown;

export class VCalculator extends BaseValue<"Calculator", SerializedCalculator> {
  readonly type = "Calculator";

  private error: REOther | null = null;

  constructor(public value: Calculator) {
    super();
    if (!value.fn.parameterCounts().includes(value.inputs.length)) {
      this.setError(
        `Calculator function needs ${value.fn.parameterCountString()} parameters, but ${
          value.inputs.length
        } fields were provided.`
      );
    }

    if (value.inputs.some((x) => x.name === "")) {
      this.setError(`Calculator field names can't be empty.`);
    }

    const fieldNames = value.inputs.map((f) => f.name);
    const uniqueNames = new Set(fieldNames);
    if (fieldNames.length !== uniqueNames.size) {
      this.setError(`Duplicate calculator field names found.`);
    }
  }

  private setError(message: string): void {
    this.error = new REOther(message);
  }

  getError(): REOther | null {
    return this.error;
  }

  valueToString() {
    return `Calculator`;
  }

  override serialize(): SerializedCalculator {
    throw new Error("Method not implemented.");
  }

  static deserialize(
    payload: SerializedCalculator,
    visit: (id: number) => Value
  ): VCalculator {
    throw new Error("Method not implemented.");
  }
}

export const vCalculator = (v: Calculator) => new VCalculator(v);
