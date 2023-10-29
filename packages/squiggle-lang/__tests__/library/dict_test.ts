import { testEvalToBe } from "../helpers/reducerHelpers.js";

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
  testEvalToBe("Dict.keys({a: 1, b: 2})", '["a","b"]');
  testEvalToBe("Dict.values({a: 1, b: 2})", "[1,2]");
  testEvalToBe("Dict.toList({a: 1, b: 2})", '[["a",1],["b",2]]');
  testEvalToBe("Dict.fromList([['a', 1], ['b', 2]])", "{a: 1,b: 2}");
  testEvalToBe("Dict.map({a: 1, b: 2}, {|x| x * 2})", "{a: 2,b: 4}");
  testEvalToBe(
    "Dict.mapKeys({a: 1, b: 2}, {|x| concat(x, 'hi')})",
    "{ahi: 1,bhi: 2}"
  );

  describe("Dict.pick", () => {
    testEvalToBe('Dict.pick({a: 1,b: 2,c: 3}, ["a", "b"])', "{a: 1,b: 2}");
    testEvalToBe('Dict.pick({a: 1,b: 2,c: 3}, ["a", "d"])', "{a: 1}");
    testEvalToBe('Dict.pick({a: 1,b: 2,c: 3}, ["d", "e"])', "{}");
    testEvalToBe("Dict.pick({a: 1,b: 2,c: 3}, [])", "{}");
  });

  describe("Dict.omit", () => {
    testEvalToBe('Dict.omit({a: 1,b: 2,c: 3}, ["a", "b"])', "{c: 3}");
    testEvalToBe('Dict.omit({a: 1,b: 2,c: 3}, ["a", "d"])', "{b: 2,c: 3}");
    testEvalToBe(
      'Dict.omit({a: 1, b: 2, c: 3}, ["d", "e"])',
      "{a: 1,b: 2,c: 3}"
    );
    testEvalToBe("Dict.omit({a: 1,b: 2,c: 3}, [])", "{a: 1,b: 2,c: 3}");
  });
});
