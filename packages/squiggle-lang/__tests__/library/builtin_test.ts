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
    testEvalToBe('"foo" == 3', "false");
    testEvalToBe('"foo" == false', "false");
    testEvalToBe('"foo" == false', "false");
    testEvalToBe('"" == 0', "false");
    testEvalToBe('"" == true', "false");
    testEvalToBe("0 == true", "false");
    testEvalToBe("0 == false", "false");
    testEvalToBe('"" == false', "false");
    testEvalToBe("normal(5,2) == normal(5,2)", "false");
    testEvalToBe("Sym.normal(5,2) == Sym.normal(5,2)", "true");
    testEvalToBe("Sym.uniform(10,12) == Sym.normal(5,2)", "false");
    testEvalToBe("Sym.pointMass(1) == 1", "false");
    testEvalToBe("Sym.pointMass(1) == Sym.pointMass(1)", "true");
    testEvalToBe("mx(1,5) == mx(1,5)", "true");
    testEvalToBe(
      "SampleSet.fromList([3,5,2,3,5,2,3,5,2,3,3,5]) == SampleSet.fromList([3,5,2,3,5,2,3,5,2,3,3,5])",
      "true"
    );
    testEvalToBe(
      "SampleSet.fromList([3,5,2,3,5,2,3,5,2,3,3,5]) == SampleSet.fromList([3,5,2,3,5,2])",
      "false"
    );
    testEvalToBe(
      "SampleSet.fromList([3,5,2,3,5,2]) == SampleSet.fromList([3,5,2,3,5,2,3,5,2,3,3,5])",
      "false"
    );
    testEvalToBe("SampleSet.fromList([3,5,2,3,5,2]) == normal(5,2)", "false");
    testEvalToBe("3 to 8 == 3", "false");
    testEvalToBe("3 to 8 != 3", "true");
    testEvalToBe("[1, [2, 3]] == [1, [2, 3]]", "true");
    testEvalToBe("{a: 1, b: {c: 2}} == {a: 1, b: {c: 2}}", "true");
    testEvalToBe('"foo\\nbar" == "foo\\r\\nbar"', "false");
    testEvalToBe("[] == []", "true");
    testEvalToBe("true == 1", "false");
  });
  describe("typeOf", () => {
    testEvalToBe("typeOf(3)", '"Number"');
    testEvalToBe("typeOf(3 to 5)", '"Distribution"');
    testEvalToBe("typeOf(true)", '"Boolean"');
    testEvalToBe("typeOf({|f| f})", '"Function"');
  });
});
