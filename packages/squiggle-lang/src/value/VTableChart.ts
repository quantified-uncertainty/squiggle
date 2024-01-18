import { Lambda } from "../reducer/lambda.js";
import { BaseValue } from "./BaseValue.js";
import { Value } from "./index.js";

export type TableChart = {
  data: readonly Value[];
  columns: readonly { fn: Lambda; name: string | undefined }[];
};

export class VTableChart extends BaseValue {
  readonly type = "TableChart";

  override get publicName() {
    return "Table Chart";
  }

  constructor(public value: TableChart) {
    super();
  }

  valueToString() {
    return `Table with ${this.value.columns.length}x${this.value.data.length} elements`;
  }
}

export const vTableChart = (v: TableChart) => new VTableChart(v);
