import { type Type } from "../types/Type.js";
import { Value } from "../value/index.js";

/*
 * Domains are runtime values that describe the sets of values that can be used
 * in a given context.
 *
 * Each domain has two aspects to it: compile-time check and runtime check.
 *
 * For example, `Number.rangeDomain(0, 10)` is a domain that describes the set
 * of numbers between 0 and 10. Its compile-time check is to ensure that the
 * value is a number, and its runtime check is to ensure that the number is
 * between 0 and 10.
 */
export abstract class BaseDomain<T> {
  abstract kind: string;
  abstract type: Type<T>;

  abstract toString(): string;

  abstract validateValue(value: Value): void;
}
