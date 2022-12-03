import { testEvalToBe } from "../helpers/reducerHelpers";

describe("Dict", () => {
  testEvalToBe("Dict.set({a: 1, b: 2}, 'c', 3)", "{a: 1,b: 2,c: 3}");
  testEvalToBe("d={a: 1, b: 2}; _=Dict.set(d, 'c', 3); d", "{a: 1,b: 2}"); // Immutable
  testEvalToBe(
    "Dict.merge({a: 1, b: 2}, {b: 3, c: 4, d: 5})",
    "{a: 1,b: 3,c: 4,d: 5}"
  );
  testEvalToBe(
    "Dict.mergeMany([{a: 1, b: 2}, {c: 3, d: 4}, {c: 5, e: 6}])",
    "{a: 1,b: 2,c: 5,d: 4,e: 6}"
  );
  testEvalToBe("Dict.keys({a: 1, b: 2})", "['a','b']");
  testEvalToBe("Dict.values({a: 1, b: 2})", "[1,2]");
  testEvalToBe("Dict.toList({a: 1, b: 2})", "[['a',1],['b',2]]");
  testEvalToBe("Dict.fromList([['a', 1], ['b', 2]])", "{a: 1,b: 2}");
  testEvalToBe("Dict.map({a: 1, b: 2}, {|x| x * 2})", "{a: 2,b: 4}");
});
