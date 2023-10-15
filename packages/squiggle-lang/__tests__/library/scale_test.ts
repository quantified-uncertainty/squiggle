import { testEvalToBe, testEvalToMatch } from "../helpers/reducerHelpers.js";

describe("Scales", () => {
  testEvalToBe("Scale.linear()", "Linear scale");
  testEvalToMatch(
    "Scale.linear({ min: 10, max: 5 })",
    "Max must be greater than min, got: min=10, max=5"
  );
  testEvalToMatch(
    "Scale.linear({ min: 5, max: 10, tickFormat: '....' })",
    "Error(Argument Error: Tick format [....] is invalid.)"
  );

  testEvalToBe("Scale.log()", "Logarithmic scale");
  testEvalToMatch(
    "Scale.log({ min: 10, max: 5 })",
    "Max must be greater than min, got: min=10, max=5"
  );
  testEvalToMatch(
    "Scale.log({ min: -1 })",
    "Min must be over 0 for log scale, got: -1"
  );

  testEvalToBe("Scale.symlog()", "Symlog scale ({constant: 0.0001})");
  testEvalToMatch(
    "Scale.symlog({ min: 10, max: 5 })",
    "Max must be greater than min, got: min=10, max=5"
  );

  testEvalToBe("Scale.power({ exponent: 2 })", "Power scale ({exponent: 2})");
  testEvalToMatch(
    "Scale.power({ min: 10, max: 5, exponent: 2 })",
    "Max must be greater than min, got: min=10, max=5"
  );
});
