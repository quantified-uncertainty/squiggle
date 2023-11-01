import { SqError, SqValue, result } from "@quri/squiggle-lang";
import { SqValueWithContext } from "../../lib/utility.js";

export type InputResults = Record<string, SqValueResult | undefined>;

export type FormShape = Record<string, string | boolean>;

export type SqCalculatorValueWithContext = Extract<
  SqValueWithContext,
  { tag: "Calculator" }
>;

export type SqValueResult = result<SqValue, SqError>; /**

 * This type is used for backing up calculator state to ViewerContext.
 * The backup is necessary for two reasons:
 * 1. Calculator component can be destroyed and recreated on code changes.
 * 2. ViewerContext is responsible for `collapsed` states of items, including the nested values in `calculatorResult`.
 */
export type CalculatorState = {
  hashString: string;
  formValues?: FormShape;
  inputResults?: InputResults;
  calculatorResult?: SqValueResult;
};
