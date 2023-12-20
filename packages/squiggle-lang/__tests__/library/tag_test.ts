import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Tags", () => {
  testEvalToBe('5 -> Tag.name("five")', '5, with params name: "five"');
  testEvalToBe(
    `
@name("five")
x = 5

x
`,
    '5, with params name: "five"'
  );

  testEvalToBe(
    `
@name("five")
@description("This is five")
x = 5

x
`,
    '5, with params name: "five", description: "This is five"'
  );

  testEvalToBe(
    `
@getName
x = 5

x
`,
    "Error(Tag.getName is not a decorator)"
  );
});
