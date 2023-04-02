import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Plot", () => {
  testEvalToBe(
    'Plot.dists({dists: [{name: "dist1", value: 2}, {name: "dist2", value: 2 to 5}]})',
    "Plot containing dist1, dist2"
  );
});
