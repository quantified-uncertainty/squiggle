import { testEvalToBe, testEvalToMatch } from "../helpers/reducerHelpers.js";

describe("Plot", () => {
  describe("Plot.dists", () => {
    testEvalToBe(
      'Plot.dists({dists: [{name: "dist1", value: 2}, {name: "dist2", value: 2 to 5}]})',
      "Plot containing dist1, dist2"
    );
  });

  describe("Plot.numericFn", () => {
    testEvalToMatch(
      `Plot.numericFn({
        fn: {|x| x * 5}
      })`,
      "Plot for numeric function"
    );

    testEvalToMatch(
      `Plot.numericFn({
        fn: {|x| x * 5}
      })`,
      "Plot for numeric function"
    );

    testEvalToMatch(
      `Plot.numericFn({
        fn: {|x, y| x * y}
      })`,
      "Expected a function with one parameter"
    );
  });

  describe("Plot.distFn", () => {
    testEvalToMatch(
      `Plot.distFn({
        fn: {|x| x to x + 1}
       })`,
      "Plot for dist function"
    );

    testEvalToMatch(
      `Plot.distFn({
        fn: {|x,y| x to x + y}
       })`,
      "Expected a function with one parameter"
    );
  });
});
