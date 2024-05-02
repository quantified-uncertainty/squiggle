import { Lambda } from "../reducer/lambda.js";
import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../serialization/squiggle.js";
import { BaseValue } from "./BaseValue.js";
import { Value, vLambda } from "./index.js";

export type TableChart = {
  data: readonly Value[];
  columns: readonly { fn: Lambda; name: string | undefined }[];
};

type SerializedTableChart = {
  dataIds: number[];
  columns: readonly { fnId: number; name?: string }[];
};

export class VTableChart extends BaseValue<"TableChart", SerializedTableChart> {
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

  override serializePayload(
    visit: SquiggleSerializationVisitor
  ): SerializedTableChart {
    return {
      dataIds: this.value.data.map((item) => visit.value(item)),
      columns: this.value.columns.map(({ fn, name }) => ({
        fnId: visit.value(vLambda(fn)),
        name,
      })),
    };
  }

  static deserialize(
    _value: SerializedTableChart,
    visit: SquiggleDeserializationVisitor
  ): VTableChart {
    return new VTableChart({
      data: _value.dataIds.map((id) => visit.value(id)),
      columns: _value.columns.map(({ fnId, name }) => {
        const lambda = visit.value(fnId);
        if (lambda.type !== "Lambda") {
          throw new Error("Expected lambda");
        }
        return {
          fn: lambda.value,
          name,
        };
      }),
    });
  }
}

export const vTableChart = (v: TableChart) => new VTableChart(v);
