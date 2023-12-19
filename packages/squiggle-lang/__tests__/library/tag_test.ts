import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Tag functions", () => {
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
});
