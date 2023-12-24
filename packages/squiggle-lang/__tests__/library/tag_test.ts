import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Tags", () => {
  describe("name", () => {
    testEvalToBe("123 -> Tag.name('myNumber') -> Tag.getName", '"myNumber"');
  });

  describe("description", () => {
    testEvalToBe(
      "123 -> Tag.description('myNumber') -> Tag.getDescription",
      '"myNumber"'
    );
  });

  describe("all", () => {
    testEvalToBe(
      "123 -> Tag.name('myName') -> Tag.description('myDescription') -> Tag.all",
      '{name: "myName",description: "myDescription"}'
    );
  });

  describe("format", () => {
    testEvalToBe("123 -> Tag.format('.2%') -> Tag.getFormat", '".2%"');
  });

  describe("omit", () => {
    testEvalToBe(
      "123 -> Tag.name('myName') -> Tag.description('myDescription') -> Tag.format('.2%') -> Tag.omit(['name', 'description']) -> Tag.all",
      '{numberFormat: ".2%"}'
    );
  });

  describe("clear", () => {
    testEvalToBe(
      "123 -> Tag.name('myName') -> Tag.description('myDescription') -> Tag.format('.2%') -> Tag.clear -> Tag.all",
      "{}"
    );
  });

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

  describe("can access tags when called as a decorator", () => {
    testEvalToBe(
      `
@showAs({|f| Tag.getName(f) == "testName" ? Plot.dist(f) : "none"})
@name("testName")
x = 5 to 10

x -> Tag.getName
`,
      '"testName"'
    );
  });
});
