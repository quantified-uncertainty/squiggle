import { testEvalToBe } from "../helpers/reducerHelpers.js";

testEvalToBe(
  `Calculator.make(
{|x, y| x + y },
{
  inputs: [
    Input.text({ name: "x" }),
  ],
})`,
  "Error(Error: Calculator function needs 2 parameters, but 1 fields were provided.)"
);

testEvalToBe(
  `Calculator.make(
reduce,
{
  inputs: [
    Input.text({ name: "x" }),
  ],
})`,
  "Error(Error: Calculator function needs 2 or 3 parameters, but 1 fields were provided.)"
);
