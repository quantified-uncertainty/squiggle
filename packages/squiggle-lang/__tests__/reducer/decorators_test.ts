import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("decorators", () => {
  // reference vars in decorators
  // see also: https://github.com/quantified-uncertainty/squiggle/issues/3111
  testEvalToBe(
    `
n = "Na"
n2 = "me"

@name(n + n2)
x = 1

Tag.getName(x)
`,
    '"Name"'
  );
});
