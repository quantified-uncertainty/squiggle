import { Lambda } from "../reducer/lambda.js";
import { BaseValue } from "./BaseValue.js";
import { Value, vLambda } from "./index.js";
import { SerializationStorage } from "./serialize.js";

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
    storage: SerializationStorage
  ): SerializedTableChart {
    return {
      dataIds: this.value.data.map((item) => storage.serializeValue(item)),
      columns: this.value.columns.map(({ fn, name }) => ({
        fnId: storage.serializeValue(vLambda(fn)),
        name,
      })),
    };
  }

  static deserialize(
    _value: SerializedTableChart,
    load: (id: number) => Value
  ): VTableChart {
    return new VTableChart({
      data: _value.dataIds.map(load),
      columns: _value.columns.map(({ fnId, name }) => {
        const lambda = load(fnId);
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
