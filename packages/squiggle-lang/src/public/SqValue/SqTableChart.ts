import { Env } from "../../dist/env.js";
import { Lambda } from "../../reducer/lambda.js";
import * as Result from "../../utility/result.js";
import { TableChart } from "../../value/VTableChart.js";
import { SqError, SqOtherError } from "../SqError.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqValuePathEdge } from "../SqValuePath.js";
import { SqValue, wrapValue } from "./index.js";
import { SqLambda } from "./SqLambda.js";

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
  const newContext: SqValueContext | undefined = context?.extend(
    SqValuePathEdge.fromCellAddress(row, column)
  );

  if (response.ok && context) {
    return Result.Ok(wrapValue(response.value._value, newContext));
  } else if (response.ok) {
    return Result.Err(new SqOtherError("Context creation for table failed."));
  } else {
    return response;
  }
};

type TableItems = Result.result<SqValue, SqError>[][];

export class SqTableChart {
  constructor(
    private _value: TableChart,
    public context?: SqValueContext,
    public cache?: TableItems
  ) {}

  item(
    rowI: number,
    columnI: number,
    env: Env
  ): Result.result<SqValue, SqError> {
    return getItem(
      rowI,
      columnI,
      wrapValue(this._value.data[rowI], this.context),
      wrapFn(this._value.columns[columnI]),
      env,
      this.context
    );
  }

  items(env: Env): TableItems {
    const wrappedDataItems = this._value.data.map((r) =>
      wrapValue(r, this.context)
    );
    const wrappedFns = this._value.columns.map(wrapFn);

    return wrappedDataItems.map((item, rowI) =>
      wrappedFns.map((fn, columnI) =>
        getItem(rowI, columnI, item, fn, env, this.context)
      )
    );
  }

  itemsAndCache(env: Env): TableItems {
    this.cache = this.items(env);
    return this.cache;
  }

  get rowCount(): number {
    return this._value.data.length;
  }

  get columnCount(): number {
    return this._value.columns.length;
  }

  get columnNames(): (string | undefined)[] {
    return this._value.columns.map(({ name }) => name);
  }
}
