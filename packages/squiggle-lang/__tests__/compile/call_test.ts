import { testCompileEnd } from "../helpers/compileHelpers.js";

describe("Compiling calls", () => {
  describe("Basic calls", () => {
    // builtin functions
    testCompileEnd("add(1,2)", "(Call add 1 2)");

    // namespaced builtin functions
    testCompileEnd("List.make(1,2)", "(Call List.make 1 2)");
  });

  describe("Infix calls", () => {
    testCompileEnd("1+2", "(Call add 1 2)");
    testCompileEnd("(1+2)", "(Call add 1 2)");
  });

  describe("Unary calls", () => {
    testCompileEnd("-1", "(Call unaryMinus 1)");
    testCompileEnd("!true", "(Call not true)");
    testCompileEnd("1 + -1", "(Call add 1 (Call unaryMinus 1))");
  });

  describe("Index lookups", () => {
    testCompileEnd("([0,1,2])[1]", "(Call $_atIndex_$ (Array 0 1 2) 1)");
  });

  describe("Pipes", () => {
    testCompileEnd("1 -> add(2)", "(Call add 1 2)");
    // note that unary has higher priority naturally
    testCompileEnd("-1 -> add(2)", "(Call add (Call unaryMinus 1) 2)");
    testCompileEnd("1 -> add(2) * 3", "(Call multiply (Call add 1 2) 3)");
  });
});
