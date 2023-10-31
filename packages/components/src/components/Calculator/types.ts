import { SqError, SqValue, result } from "@quri/squiggle-lang";
import { SqValueWithContext } from "../../lib/utility.js";

export type InputValues = Record<string, SqValueResult | undefined>;

export type FormShape = Record<string, string | boolean>;

export type SqCalculatorValueWithContext = Extract<
  SqValueWithContext,
  { tag: "Calculator" }
>;

export type SqValueResult = result<SqValue, SqError>;
