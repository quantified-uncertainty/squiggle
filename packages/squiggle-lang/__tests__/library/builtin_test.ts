import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Operators", () => {
  describe("concat", () => {
    testEvalToBe("'foo' + 'bar'", '"foobar"');
    testEvalToBe("'foo' + '3'", `"foo3"`);
    testEvalToBe("'foo: ' + Sym.normal(3,2)", '"foo: Normal(3,2)"');
    testEvalToBe("concat('foo', '3')", '"foo3"');
    testEvalToBe("concat('a ', 'b')", '"a b"');
  });
  describe("equal", () => {
    testEvalToBe("3 == 5", "false");
    testEvalToBe("3 == 3", "true");
    testEvalToBe("3 == 5", "false");
    testEvalToBe('"foo" == "bar"', "false");
    testEvalToBe('"foo" == "foo"', "true");
  });
  describe("typeOf", () => {
    testEvalToBe("typeOf(3)", '"Number"');
    testEvalToBe("typeOf(3 to 5)", '"Dist"');
    testEvalToBe("typeOf(true)", '"Bool"');
    testEvalToBe("typeOf({|f| f})", '"Lambda"');
  });
});
