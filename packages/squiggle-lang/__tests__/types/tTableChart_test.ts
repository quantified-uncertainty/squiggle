import { tTableChart } from "../../src/types/index.js";
import { vTableChart } from "../../src/value/VTableChart.js";

test("pack/unpack", () => {
  const tableChart = { columns: [], data: [] };
  const value = vTableChart(tableChart);
  expect(tTableChart.unpack(value)).toBe(tableChart);
  expect(tTableChart.pack(tableChart)).toEqual(value);
});
