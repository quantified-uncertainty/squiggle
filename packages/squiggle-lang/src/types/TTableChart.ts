import { Value } from "../value/index.js";
import { TableChart, vTableChart } from "../value/VTableChart.js";
import { Type } from "./Type.js";

export class TTableChart extends Type<TableChart> {
  unpack(v: Value) {
    return v.type === "TableChart" ? v.value : undefined;
  }

  pack(v: TableChart) {
    return vTableChart(v);
  }

  override display() {
    return "Table";
  }
}

export const tTableChart = new TTableChart();
