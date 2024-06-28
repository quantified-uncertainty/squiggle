import { parse } from "../../src/ast/parse.js";
import { ASTNode } from "../../src/ast/types.js";
import {
    testEvalError,
    testEvalToBe,
    testParse,
} from "../helpers/reducerHelpers.js";

describe("type checking", () => {
  describe("basic arithmetic", () => {
    test("assign m/s to m*s", () => expect(() => parse(
        `
x :: m = 1
y :: s = 4
z :: m/s = x * y`,
        "test")).toThrow(Error));

    test("assign m/s to m/s", () => expect(() => parse(
        `
x :: m = 1
y :: s = 4
z :: m/s = x / y`,
        "test")).not.toThrow());
  });

});
