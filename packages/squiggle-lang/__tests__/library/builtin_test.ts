import { testEvalError, testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Operators", () => {
  describe("concat", () => {
    testEvalToBe("'foo' + 'bar'", "'foobar'");
    testEvalToBe("'foo' + '3'", `'foo3'`);
    testEvalToBe("'foo: ' + normal(3,2)", "'foo: Normal(3,2)'");
    testEvalToBe("concat('foo', '3')", "'foo3'");
    testEvalToBe("concat('a ', 'b')", "'a b'");
  });
  describe("equal", () => {
    testEvalToBe("3 == 5", "false");
    testEvalToBe("3 == 3", "true");
    testEvalToBe("3 == 5", "false");
    testEvalToBe('"foo" == "bar"', "false");
    testEvalToBe('"foo" == "foo"', "true");
  });
});
