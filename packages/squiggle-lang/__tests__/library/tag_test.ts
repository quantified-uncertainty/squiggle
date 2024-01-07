import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Tags", () => {
  describe("name", () => {
    testEvalToBe("123 -> Tag.name('myNumber') -> Tag.getName", '"myNumber"');
  });

  describe("doc", () => {
    testEvalToBe("123 -> Tag.doc('myNumber') -> Tag.getDoc", '"myNumber"');
  });

  describe("all", () => {
    testEvalToBe(
      "123 -> Tag.name('myName') -> Tag.doc('myDoc') -> Tag.all",
      '{name: "myName",doc: "myDoc"}'
    );
  });

  describe("format", () => {
    testEvalToBe("123 -> Tag.format('.2%') -> Tag.getFormat", '".2%"');
  });

  describe("notebook", () => {
    testEvalToBe("[123] -> Tag.notebook -> Tag.getNotebook", "true");
  });

  describe("omit", () => {
    testEvalToBe(
      "123 -> Tag.name('myName') -> Tag.doc('myDoc') -> Tag.format('.2%') -> Tag.omit(['name', 'doc']) -> Tag.all",
      '{numberFormat: ".2%"}'
    );
  });

  describe("clear", () => {
    testEvalToBe(
      "123 -> Tag.name('myName') -> Tag.doc('myDoc') -> Tag.format('.2%') -> Tag.clear -> Tag.all",
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
@doc("This is five")
x = 5

x
`,
    '5, with params name: "five", doc: "This is five"'
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

  testEvalToBe(
    `
@showAs(Calculator)
x(t) = t

x -> Tag.getShowAs
`,
    "Calculator"
  );
});
