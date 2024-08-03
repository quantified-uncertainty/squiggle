import { tPlot } from "../../src/types";
import { Plot, vPlot } from "../../src/value/VPlot";

test("pack/unpack", () => {
  const plot: Plot = {
    type: "distributions",
    distributions: [],
    xScale: { method: { type: "linear" } },
    yScale: { method: { type: "linear" } },
    showSummary: false,
  };
  const value = vPlot(plot);
  expect(tPlot.unpack(value)).toBe(plot);
  expect(tPlot.pack(plot)).toEqual(value);
});
