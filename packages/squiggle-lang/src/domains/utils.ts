import { REDomainError } from "../errors/messages.js";
import { Value } from "../value/index.js";
import { Domain } from "./index.js";

export function assertCorrectType<T extends Value["type"]>(
  value: Value,
  expectedType: T
): asserts value is Extract<Value, { type: T }> {
  if (value.type !== expectedType) {
    throw new REDomainError(
      `Parameter ${value.toString()}, of type ${
        value.type
      }, must be a ${expectedType}`
    );
  }
}

export function assertWithinBounds(
  min: number,
  max: number,
  value: number,
  domain: Domain,
  format: (n: number) => string = (n) => n.toString()
) {
  if (value < min || value > max) {
    throw new REDomainError(
      `Parameter ${format(value)} must be in domain ${domain.toString()}`
    );
  }
}
