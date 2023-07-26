import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Table Chart", () => {
  testEvalToBe(
    `Table.make(
        {
          data: [1, 4, 5],
          columns: [
            { fn: {|e|e}, name: "Number" },
            { fn: {|e| normal(e^2, e^3)}, name: "Dist" },
            { fn: {|e|[e, e, e, e]}, name: "Array" },
            { fn: {|e|{first: e, second: e+1, third: e+2, fourth: e+3}}, name: "Dict" }
          ]})`,
    "Table with 4x3 elements"
  );
});
