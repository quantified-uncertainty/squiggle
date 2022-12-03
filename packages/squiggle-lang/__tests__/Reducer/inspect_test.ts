import { testEvalToBe } from "../helpers/reducerHelpers";

/*
    You can wrap around any expression with inspect(expr) to log the value of that expression.
    This is useful for debugging. inspect(expr) returns the value of expr, but also prints it out.

    There is a second version of inspect that takes a label, which will print out the label and the value.

    inspectPerformace(expr, label) will print out the value of expr, the label, and the time it took to evaluate expr.
*/
describe("Debugging", () => {
  testEvalToBe("inspect(1)", "1");
  testEvalToBe('inspect(1, "one")', "1");
});
