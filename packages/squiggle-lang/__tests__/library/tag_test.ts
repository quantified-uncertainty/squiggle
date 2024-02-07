import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Tags", () => {
  testEvalToBe("123 -> Tag.name('')", '123, with tags {name: ""}');
  describe("name", () => {
    testEvalToBe("123 -> Tag.name('myNumber') -> Tag.getName", '"myNumber"');
  });

  describe("doc", () => {
    testEvalToBe("123 -> Tag.doc('myNumber') -> Tag.getDoc", '"myNumber"');
  });

  describe("all", () => {
    testEvalToBe(
      "123 -> Tag.name('myName') -> Tag.doc('myDoc') -> Tag.getAll",
      '{name: "myName", doc: "myDoc"}'
    );
  });

  describe("format", () => {
    testEvalToBe("123 -> Tag.format('.2%') -> Tag.getFormat", '".2%"');
    testEvalToBe("0 -> Tag.format('.2%') -> Tag.getFormat", '".2%"');
  });

  describe("notebook", () => {
    testEvalToBe("[123] -> Tag.notebook -> Tag.getNotebook", "true");
  });

  describe("hide", () => {
    testEvalToBe("3 -> Tag.hide -> Tag.getHide", "true");
  });

  describe("location", () => {
    testEvalToBe(
      `@location
a = 3
Tag.getLocation(a)
`,
      '{source: "main", start: {line: 2, column: 1, offset: 10}, end: {line: 2, column: 6, offset: 15}}'
    );
  });

  describe("startOpenToggle", () => {
    testEvalToBe("3 -> Tag.startOpen -> Tag.getStartOpenState", '"open"');
    testEvalToBe("3 -> Tag.startClosed -> Tag.getStartOpenState", '"closed"');
    testEvalToBe(
      "3 -> Tag.startClosed -> Tag.startOpen -> Tag.getStartOpenState",
      '"open"'
    );
  });

  describe("omit", () => {
    testEvalToBe(
      "123 -> Tag.name('myName') -> Tag.doc('myDoc') -> Tag.format('.2%') -> Tag.omit(['name', 'doc']) -> Tag.getAll",
      '{numberFormat: ".2%"}'
    );
  });

  describe("clear", () => {
    testEvalToBe(
      "123 -> Tag.name('myName') -> Tag.doc('myDoc') -> Tag.format('.2%') -> Tag.clear -> Tag.getAll",
      "{}"
    );
  });

  testEvalToBe(
    `
@name("five")
x = 5

x
`,
    '5, with tags {name: "five"}'
  );

  testEvalToBe(
    `
@name("five")
@doc("This is five")
x = 5

x
`,
    '5, with tags {doc: "This is five", name: "five"}'
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
