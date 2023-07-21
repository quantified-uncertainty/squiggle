import { BaseDist } from "../../dist/BaseDist.js";
import { SampleSetDist } from "../../dist/SampleSetDist/index.js";
import { Env } from "../../dist/env.js";
import * as Result from "../../utility/result.js";
import { TableChart } from "../../value/index.js";

import { SqError, SqOtherError } from "../SqError.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqLambda } from "./SqLambda.js";
import { SqValue, wrapValue } from "./index.js";

export class SqTableChart {
  constructor(private _value: TableChart, public context?: SqValueContext) {}

  items(env: Env): Result.result<SqValue, SqError>[][] {
    const wrappedElements = this._value.elements.map((r) =>
      wrapValue(r, this.context)
    );
    const wrappedFns = this._value.columns.map(
      ({ fn }) => new SqLambda(fn, undefined)
    );

    const getItem = (
      rowI: number,
      columnI: number,
      element: SqValue,
      fn: SqLambda
    ): Result.result<SqValue, SqError> => {
      const response = fn.call([element], env);
      const context: SqValueContext | undefined =
        this.context && this.context.extend(`item(${rowI}:${columnI})`);

      if (response.ok && context) {
        return Result.Ok(wrapValue(response.value._value, context));
      } else if (response.ok) {
        return Result.Err(
          new SqOtherError("Context creation for table failed.")
        );
      } else {
        return response;
      }
    };

    return wrappedElements.map((element, rowI) =>
      wrappedFns.map((fn, columnI) => getItem(rowI, columnI, element, fn))
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
