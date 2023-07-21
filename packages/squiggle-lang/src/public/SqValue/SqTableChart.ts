import { BaseDist } from "../../dist/BaseDist.js";
import { SampleSetDist } from "../../dist/SampleSetDist/index.js";
import { Env } from "../../dist/env.js";
import * as Result from "../../utility/result.js";
import { TableChart } from "../../value/index.js";

import { SqError, SqOtherError } from "../SqError.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqLambda } from "./SqLambda.js";
import { SqValue, wrapValue } from "./index.js";
import { Value } from "../../value/index.js";
import { Lambda } from "../../reducer/lambda.js";
import { wrap } from "module";

const wrapElement = (value: Value, context?: SqValueContext): SqValue => {
  return wrapValue(value, context);
};

const wrapFn = ({ fn }: { fn: Lambda }): SqLambda => {
  return new SqLambda(fn, undefined);
};

const getItem = (
  row: number,
  column: number,
  element: SqValue,
  fn: SqLambda,
  env: Env,
  context?: SqValueContext
): Result.result<SqValue, SqError> => {
  const response = fn.call([element], env);
  const newContext: SqValueContext | undefined =
    context && context.extend({ row, column });

  if (response.ok && context) {
    return Result.Ok(wrapValue(response.value._value, newContext));
  } else if (response.ok) {
    return Result.Err(new SqOtherError("Context creation for table failed."));
  } else {
    return response;
  }
};

export class SqTableChart {
  constructor(private _value: TableChart, public context?: SqValueContext) {}

  item(
    rowI: number,
    columnI: number,
    env: Env
  ): Result.result<SqValue, SqError> {
    return getItem(
      rowI,
      columnI,
      wrapElement(this._value.elements[rowI], this.context),
      wrapFn(this._value.columns[columnI]),
      env,
      this.context
    );
  }

  items(env: Env): Result.result<SqValue, SqError>[][] {
    const wrappedElements = this._value.elements.map((r) =>
      wrapValue(r, this.context)
    );
    const wrappedFns = this._value.columns.map(
      ({ fn }) => new SqLambda(fn, undefined)
    );

    return wrappedElements.map((element, rowI) =>
      wrappedFns.map((fn, columnI) =>
        getItem(rowI, columnI, element, fn, env, this.context)
      )
    );
  }

  get rowCount(): number {
    return this._value.elements.length;
  }

  get columnCount(): number {
    return this._value.columns.length;
  }

  get columnNames(): (string | undefined)[] {
    return this._value.columns.map(({ name }) => name);
  }
}
