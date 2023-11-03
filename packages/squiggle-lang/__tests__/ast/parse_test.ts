import { ASTNode, parse } from "../../src/ast/parse.js";
import {
  testEvalError,
  testEvalToBe,
  testParse,
} from "../helpers/reducerHelpers.js";

describe("Peggy parse", () => {
  describe("float", () => {
    test.each([
      ["1.", { integer: 1, fractional: null, exponent: null }],
      ["1.1", { integer: 1, fractional: "1", exponent: null }],
      [".1", { integer: 0, fractional: "1", exponent: null }],
      [".001", { integer: 0, fractional: "001", exponent: null }],
      ["0.1", { integer: 0, fractional: "1", exponent: null }],
      ["1e1", { integer: 1, fractional: null, exponent: 1 }],
      ["1e-1", { integer: 1, fractional: null, exponent: -1 }],
      [".1e1", { integer: 0, fractional: "1", exponent: 1 }],
      ["0.1e1", { integer: 0, fractional: "1", exponent: 1 }],
      ["0.1e+3", { integer: 0, fractional: "1", exponent: 3 }],
      ["0.1e-3", { integer: 0, fractional: "1", exponent: -3 }],
    ] satisfies [
      string,
      Pick<
        Extract<ASTNode, { type: "Float" }>,
        "integer" | "fractional" | "exponent"
      >,
    ][])("%s", (code, expected) => {
      const result = parse(code, "test");
      if (
        !(
          result.ok &&
          result.value.type === "Program" &&
          result.value.statements.length === 1
        )
      ) {
        throw new Error();
      }
      const value = result.value.statements[0];
      if (value.type !== "Float") {
        throw new Error();
      }
      expect(value).toMatchObject(expected);
    });
    testParse("0.1e+2+5", "(Program (InfixCall + 0.1e2 5))");
    testParse("0.1e+2-5", "(Program (InfixCall - 0.1e2 5))");
    testParse("100e-2-5", "(Program (InfixCall - 100e-2 5))");
  });

  describe("units", () => {
    testEvalToBe("100%", "1");
    testEvalToBe("1-0%", "1");
  });

  describe("literals operators parenthesis", () => {
    testParse("{a}", "(Program (Block :a))");
    testParse("1", "(Program 1)");
    testParse("'hello'", "(Program 'hello')");
    testParse("true", "(Program true)");
    testParse("1+2", "(Program (InfixCall + 1 2))");
    testParse("add(1,2)", "(Program (Call :add 1 2))");
    testParse("(1)", "(Program 1)");
    testParse("(1+2)", "(Program (InfixCall + 1 2))");
  });

  describe("unary", () => {
    testParse("-1", "(Program (UnaryCall - 1))");
    testParse("!true", "(Program (UnaryCall ! true))");
    testParse("1 + -1", "(Program (InfixCall + 1 (UnaryCall - 1)))");
    testParse("-a[0]", "(Program (UnaryCall - (BracketLookup :a 0)))");
    testParse("!a[0]", "(Program (UnaryCall ! (BracketLookup :a 0)))");
  });

  describe("multiplicative", () => {
    testParse("1 * 2", "(Program (InfixCall * 1 2))");
    testParse("1 / 2", "(Program (InfixCall / 1 2))");

    // left-associative
    testParse("1 * 2 * 3", "(Program (InfixCall * (InfixCall * 1 2) 3))");
    testParse("1 * 2 / 3", "(Program (InfixCall / (InfixCall * 1 2) 3))");
    testParse("1 / 2 * 3", "(Program (InfixCall * (InfixCall / 1 2) 3))");
    testParse("1 / 2 / 3", "(Program (InfixCall / (InfixCall / 1 2) 3))");

    // precedence
    testParse(
      "1 * 2 + 3 * 4",
      "(Program (InfixCall + (InfixCall * 1 2) (InfixCall * 3 4)))"
    );
    testParse(
      "1 * 2 - 3 * 4",
      "(Program (InfixCall - (InfixCall * 1 2) (InfixCall * 3 4)))"
    );
    testParse(
      "1 * 2 .+ 3 * 4",
      "(Program (InfixCall .+ (InfixCall * 1 2) (InfixCall * 3 4)))"
    );
    testParse(
      "1 * 2 .- 3 * 4",
      "(Program (InfixCall .- (InfixCall * 1 2) (InfixCall * 3 4)))"
    );
    testParse(
      "1 * 2 + 3 .* 4",
      "(Program (InfixCall + (InfixCall * 1 2) (InfixCall .* 3 4)))"
    );
    testParse(
      "1 * 2 + 3 / 4",
      "(Program (InfixCall + (InfixCall * 1 2) (InfixCall / 3 4)))"
    );
    testParse(
      "1 * 2 + 3 ./ 4",
      "(Program (InfixCall + (InfixCall * 1 2) (InfixCall ./ 3 4)))"
    );
    testParse(
      "1 * 2 - 3 .* 4",
      "(Program (InfixCall - (InfixCall * 1 2) (InfixCall .* 3 4)))"
    );
    testParse(
      "1 * 2 - 3 / 4",
      "(Program (InfixCall - (InfixCall * 1 2) (InfixCall / 3 4)))"
    );
    testParse(
      "1 * 2 - 3 ./ 4",
      "(Program (InfixCall - (InfixCall * 1 2) (InfixCall ./ 3 4)))"
    );
    testParse(
      "1 * 2 - 3 * 4^5",
      "(Program (InfixCall - (InfixCall * 1 2) (InfixCall * 3 (InfixCall ^ 4 5))))"
    );
    testParse(
      "1 * 2 - 3 * 4^5^6",
      "(Program (InfixCall - (InfixCall * 1 2) (InfixCall * 3 (InfixCall ^ 4 (InfixCall ^ 5 6)))))"
    );
    testParse("2^3^4", "(Program (InfixCall ^ 2 (InfixCall ^ 3 4)))");
    testParse("2 .^ 3 .^ 4", "(Program (InfixCall .^ 2 (InfixCall .^ 3 4)))");
    testParse(
      "1 * -a[-2]",
      "(Program (InfixCall * 1 (UnaryCall - (BracketLookup :a (UnaryCall - 2)))))"
    );
  });

  describe("multi-line", () => {
    testParse("x=1; 2", "(Program (LetStatement :x (Block 1)) 2)");
    testParse(
      "x=1; y=2",
      "(Program (LetStatement :x (Block 1)) (LetStatement :y (Block 2)))"
    );
  });

  describe("variables", () => {
    testParse("x = 1", "(Program (LetStatement :x (Block 1)))");
    testParse("x", "(Program :x)");
    testParse("x = 1; x", "(Program (LetStatement :x (Block 1)) :x)");
  });

  describe("functions", () => {
    testParse(
      "identity(x) = x",
      "(Program (DefunStatement :identity (Lambda :x (Block :x))))"
    ); // Function definitions become lambda assignments
    testParse("identity(x)", "(Program (Call :identity :x))");

    testParse(
      "annotated(x: [3,5]) = x",
      "(Program (DefunStatement :annotated (Lambda (IdentifierWithAnnotation x (Array 3 5)) (Block :x))))"
    );
  });

  describe("arrays", () => {
    testParse("[]", "(Program (Array))");
    testParse("[0, 1, 2]", "(Program (Array 0 1 2))");
    testParse("['hello', 'world']", "(Program (Array 'hello' 'world'))");
    testParse("([0,1,2])[1]", "(Program (BracketLookup (Array 0 1 2) 1))");
  });

  describe("dicts", () => {
    testParse(
      "{a: 1, b: 2}",
      "(Program (Dict (KeyValue 'a' 1) (KeyValue 'b' 2)))"
    );
    testParse(
      "{a: 1, b: 2,}",
      "(Program (Dict (KeyValue 'a' 1) (KeyValue 'b' 2)))"
    );
    testParse("{a, b, }", "(Program (Dict :a :b))");
    testParse("{a, b}", "(Program (Dict :a :b))");
    testParse("{a, b: 2}", "(Program (Dict :a (KeyValue 'b' 2)))");
    testParse("{a,}", "(Program (Dict :a))");
    testParse(
      "{1+0: 1, 2+0: 2}",
      "(Program (Dict (KeyValue (InfixCall + 1 0) 1) (KeyValue (InfixCall + 2 0) 2)))"
    ); // key can be any expression
    testParse("dict.property", "(Program (DotLookup :dict property))");
  });

  describe("post operators", () => {
    //function call, array and dict access are post operators with higher priority than unary operators
    testParse(
      "a==!b(1)",
      "(Program (InfixCall == :a (UnaryCall ! (Call :b 1))))"
    );
    testParse(
      "a==!b[1]",
      "(Program (InfixCall == :a (UnaryCall ! (BracketLookup :b 1))))"
    );
    testParse(
      "a==!b.one",
      "(Program (InfixCall == :a (UnaryCall ! (DotLookup :b one))))"
    );
  });

  describe("comments", () => {
    testParse("1 // This is a line comment", "(Program 1)");
    testParse("1 /* This is a multi line comment */", "(Program 1)");
    testParse("/* This is a multi line comment */ 1", "(Program 1)");
    testParse(
      `
  /* This is 
  a multi line 
  comment */
  1`,
      "(Program 1)"
    );

    testParse(
      "/* first comment */ 1 + /* second comment */ 2",
      "(Program (InfixCall + 1 2))"
    );
    testParse("/* comment * with * stars */ 1", "(Program 1)");
    testParse("/* /* */ 1", "(Program 1)");
  });

  describe("ternary operator", () => {
    testParse("true ? 2 : 3", "(Program (Ternary true 2 3))");
    testParse(
      "false ? 2 : false ? 4 : 5",
      "(Program (Ternary false 2 (Ternary false 4 5)))"
    ); // nested ternary
  });

  describe("if then else", () => {
    testParse(
      "if true then 2 else 3",
      "(Program (Ternary true (Block 2) (Block 3)))"
    );
    testParse(
      "if false then {2} else {3}",
      "(Program (Ternary false (Block 2) (Block 3)))"
    );
    testParse(
      "if false then {2} else if false then {4} else {5}",
      "(Program (Ternary false (Block 2) (Ternary false (Block 4) (Block 5))))"
    ); //nested if
  });

  describe("logical", () => {
    testParse("true || false", "(Program (InfixCall || true false))");
    testParse("true && false", "(Program (InfixCall && true false))");
    testParse("a * b + c", "(Program (InfixCall + (InfixCall * :a :b) :c))"); // for comparison
    testParse(
      "a && b || c",
      "(Program (InfixCall || (InfixCall && :a :b) :c))"
    );
    testParse(
      "a && b || c && d",
      "(Program (InfixCall || (InfixCall && :a :b) (InfixCall && :c :d)))"
    );
    testParse(
      "a && !b || c",
      "(Program (InfixCall || (InfixCall && :a (UnaryCall ! :b)) :c))"
    );
    testParse(
      "a && b==c || d",
      "(Program (InfixCall || (InfixCall && :a (InfixCall == :b :c)) :d))"
    );
    testParse(
      "a && b!=c || d",
      "(Program (InfixCall || (InfixCall && :a (InfixCall != :b :c)) :d))"
    );
    testParse(
      "a && !(b==c) || d",
      "(Program (InfixCall || (InfixCall && :a (UnaryCall ! (InfixCall == :b :c))) :d))"
    );
    testParse(
      "a && b>=c || d",
      "(Program (InfixCall || (InfixCall && :a (InfixCall >= :b :c)) :d))"
    );
    testParse(
      "a && !(b>=c) || d",
      "(Program (InfixCall || (InfixCall && :a (UnaryCall ! (InfixCall >= :b :c))) :d))"
    );
    testParse(
      "a && b<=c || d",
      "(Program (InfixCall || (InfixCall && :a (InfixCall <= :b :c)) :d))"
    );
    testParse(
      "a && b>c || d",
      "(Program (InfixCall || (InfixCall && :a (InfixCall > :b :c)) :d))"
    );
    testParse(
      "a && b<c || d",
      "(Program (InfixCall || (InfixCall && :a (InfixCall < :b :c)) :d))"
    );
    testParse(
      "a && b<c[i] || d",
      "(Program (InfixCall || (InfixCall && :a (InfixCall < :b (BracketLookup :c :i))) :d))"
    );
    testParse(
      "a && b<c.i || d",
      "(Program (InfixCall || (InfixCall && :a (InfixCall < :b (DotLookup :c i))) :d))"
    );
    testParse(
      "a && b<c(i) || d",
      "(Program (InfixCall || (InfixCall && :a (InfixCall < :b (Call :c :i))) :d))"
    );
    testParse(
      "a && b<1+2 || d",
      "(Program (InfixCall || (InfixCall && :a (InfixCall < :b (InfixCall + 1 2))) :d))"
    );
    testParse(
      "a && b<1+2*3 || d",
      "(Program (InfixCall || (InfixCall && :a (InfixCall < :b (InfixCall + 1 (InfixCall * 2 3)))) :d))"
    );
    testParse(
      "a && b<1+2*-3+4 || d",
      "(Program (InfixCall || (InfixCall && :a (InfixCall < :b (InfixCall + (InfixCall + 1 (InfixCall * 2 (UnaryCall - 3))) 4))) :d))"
    );
    testParse(
      "a && b<1+2*3 || d ? true : false",
      "(Program (Ternary (InfixCall || (InfixCall && :a (InfixCall < :b (InfixCall + 1 (InfixCall * 2 3)))) :d) true false))"
    );
  });

  describe("operators", () => {
    describe("power", () => {
      testParse("2 ^ 3", "(Program (InfixCall ^ 2 3))");
    });
    describe("pointwise arithmetic expressions", () => {
      testParse(
        "normal(5,2) .+ normal(5,1)",
        "(Program (InfixCall .+ (Call :normal 5 2) (Call :normal 5 1)))"
      );
      testParse(
        "normal(5,2) .- normal(5,1)",
        "(Program (InfixCall .- (Call :normal 5 2) (Call :normal 5 1)))"
      );
      testParse(
        "normal(5,2) .* normal(5,1)",
        "(Program (InfixCall .* (Call :normal 5 2) (Call :normal 5 1)))"
      );
      testParse(
        "normal(5,2) ./ normal(5,1)",
        "(Program (InfixCall ./ (Call :normal 5 2) (Call :normal 5 1)))"
      );
      testParse(
        "normal(5,2) .^ normal(5,1)",
        "(Program (InfixCall .^ (Call :normal 5 2) (Call :normal 5 1)))"
      );
    });
    describe("equality", () => {
      testParse(
        "5 == normal(5,2)",
        "(Program (InfixCall == 5 (Call :normal 5 2)))"
      );
    });
  });

  describe("pipe", () => {
    testParse("1 -> add(2)", "(Program (Pipe 1 :add 2))");
    testParse("-1 -> add(2)", "(Program (Pipe (UnaryCall - 1) :add 2))");
    testParse(
      "-a[1] -> add(2)",
      "(Program (Pipe (UnaryCall - (BracketLookup :a 1)) :add 2))"
    );
    testParse(
      "-f(1) -> add(2)",
      "(Program (Pipe (UnaryCall - (Call :f 1)) :add 2))"
    );
    testParse("1 + 2 -> add(3)", "(Program (InfixCall + 1 (Pipe 2 :add 3)))");
    testParse("1 -> add(2) * 3", "(Program (InfixCall * (Pipe 1 :add 2) 3))");
    testParse("1 -> subtract(2)", "(Program (Pipe 1 :subtract 2))");
    testParse(
      "-1 -> subtract(2)",
      "(Program (Pipe (UnaryCall - 1) :subtract 2))"
    );
    testParse(
      "1 -> subtract(2) * 3",
      "(Program (InfixCall * (Pipe 1 :subtract 2) 3))"
    );
  });

  describe("to", () => {
    testParse("1 to 2", "(Program (InfixCall to 1 2))");
    testParse(
      "-1 to -2",
      "(Program (InfixCall to (UnaryCall - 1) (UnaryCall - 2)))"
    ); // lower than unary
    testParse(
      "a[1] to a[2]",
      "(Program (InfixCall to (BracketLookup :a 1) (BracketLookup :a 2)))"
    ); // lower than post
    testParse(
      "a.p1 to a.p2",
      "(Program (InfixCall to (DotLookup :a p1) (DotLookup :a p2)))"
    ); // lower than post
    testParse("1 to 2 + 3", "(Program (InfixCall to 1 (InfixCall + 2 3)))");
    testParse(
      "1->add(2) to 3->add(4) -> add(4)",
      "(Program (InfixCall to (Pipe 1 :add 2) (Pipe (Pipe 3 :add 4) :add 4)))"
    ); // lower than chain
  });

  describe("inner block", () => {
    // inner blocks are 0 argument lambdas. They can be used whenever a value is required.
    // Like lambdas they have a local scope.
    testParse(
      "x={y=1; y}; x",
      "(Program (LetStatement :x (Block (LetStatement :y (Block 1)) :y)) :x)"
    );
  });

  describe("lambda", () => {
    testParse("{|x| x}", "(Program (Lambda :x :x))");
    testParse("f={|x| x}", "(Program (LetStatement :f (Lambda :x :x)))");
    testParse("f(x)=x", "(Program (DefunStatement :f (Lambda :x (Block :x))))"); // Function definitions are lambda assignments
    testParse(
      "f(x)=x ? 1 : 0",
      "(Program (DefunStatement :f (Lambda :x (Block (Ternary :x 1 0)))))"
    ); // Function definitions are lambda assignments
  });

  describe("Using lambda as value", () => {
    testParse(
      "myadd(x,y)=x+y; z=myadd; z",
      "(Program (DefunStatement :myadd (Lambda :x :y (Block (InfixCall + :x :y)))) (LetStatement :z (Block :myadd)) :z)"
    );
    testParse(
      "myadd(x,y)=x+y; z=[myadd]; z",
      "(Program (DefunStatement :myadd (Lambda :x :y (Block (InfixCall + :x :y)))) (LetStatement :z (Block (Array :myadd))) :z)"
    );
    testParse(
      "myaddd(x,y)=x+y; z={x: myaddd}; z",
      "(Program (DefunStatement :myaddd (Lambda :x :y (Block (InfixCall + :x :y)))) (LetStatement :z (Block (Dict (KeyValue 'x' :myaddd)))) :z)"
    );
    testParse(
      "f({|x| x+1})",
      "(Program (Call :f (Lambda :x (InfixCall + :x 1))))"
    );
    testParse(
      "map(arr, {|x| x+1})",
      "(Program (Call :map :arr (Lambda :x (InfixCall + :x 1))))"
    );
    testParse(
      "map([1,2,3], {|x| x+1})",
      "(Program (Call :map (Array 1 2 3) (Lambda :x (InfixCall + :x 1))))"
    );
    testParse(
      "[1,2,3]->map({|x| x+1})",
      "(Program (Pipe (Array 1 2 3) :map (Lambda :x (InfixCall + :x 1))))"
    );
  });
  describe("unit", () => {
    testParse("1m", "(Program (UnitValue 1 m))");
    testParse("1M", "(Program (UnitValue 1 M))");
    testEvalToBe("1M", "1000000");
    testEvalToBe("3minutes", "3.00 minutes");
    testEvalError("1q");
    testParse(
      "1k+2M",
      "(Program (InfixCall + (UnitValue 1 k) (UnitValue 2 M)))"
    );
  });
  describe("Module", () => {
    testParse("x", "(Program :x)");
    testParse("Math.pi", "(Program :Math.pi)");
  });

  describe("Exports", () => {
    testParse("export x = 5", "(Program (LetStatement export :x (Block 5)))");
    testParse("exportx = 5", "(Program (LetStatement :exportx (Block 5)))");
  });
});

describe("parsing new line", () => {
  testParse(
    `
 a + 
 b`,
    "(Program (InfixCall + :a :b))"
  );
  testParse(
    `
 x=
 1`,
    "(Program (LetStatement :x (Block 1)))"
  );
  testParse(
    `
 x=1
 y=2`,
    "(Program (LetStatement :x (Block 1)) (LetStatement :y (Block 2)))"
  );
  testParse(
    `
 x={
  y=2;
  y }
 x`,
    "(Program (LetStatement :x (Block (LetStatement :y (Block 2)) :y)) :x)"
  );
  testParse(
    `
 x={
  y=2
  y }
 x`,
    "(Program (LetStatement :x (Block (LetStatement :y (Block 2)) :y)) :x)"
  );
  testParse(
    `
 x={
  y=2
  y 
  }
 x`,
    "(Program (LetStatement :x (Block (LetStatement :y (Block 2)) :y)) :x)"
  );
  testParse(
    `
 x=1
 y=2
 z=3
 `,
    "(Program (LetStatement :x (Block 1)) (LetStatement :y (Block 2)) (LetStatement :z (Block 3)))"
  );
  testParse(
    `
 f={
  x=1
  y=2
  z=3
  x+y+z
 }
 `,
    "(Program (LetStatement :f (Block (LetStatement :x (Block 1)) (LetStatement :y (Block 2)) (LetStatement :z (Block 3)) (InfixCall + (InfixCall + :x :y) :z))))"
  );
  testParse(
    `
 f={
  x=1
  y=2
  z=3
  x+y+z
 }
 g=f+4
 g
 `,
    "(Program (LetStatement :f (Block (LetStatement :x (Block 1)) (LetStatement :y (Block 2)) (LetStatement :z (Block 3)) (InfixCall + (InfixCall + :x :y) :z))) (LetStatement :g (Block (InfixCall + :f 4))) :g)"
  );
  testParse(
    `
 f =
  {
   x=1; //x
   y=2 //y
   z=
    3
   x+
    y+
    z
  }
 g =
  f +
   4
 g ->
  h ->
  p ->
  q 
 `,
    "(Program (LetStatement :f (Block (LetStatement :x (Block 1)) (LetStatement :y (Block 2)) (LetStatement :z (Block 3)) (InfixCall + (InfixCall + :x :y) :z))) (LetStatement :g (Block (InfixCall + :f 4))) (Pipe (Pipe (Pipe :g :h) :p) :q))"
  );
  testParse(
    `
  a ->
  b ->
  c ->
  d 
 `,
    "(Program (Pipe (Pipe (Pipe :a :b) :c) :d))"
  );
  testParse(
    `
  a ->
  b ->
  c ->
  d +
  e
 `,
    "(Program (InfixCall + (Pipe (Pipe (Pipe :a :b) :c) :d) :e))"
  );
  describe("strings", () => {
    testParse(`"test\\"\\'\\u1234-\\b\\n"`, "(Program 'test\"'\u1234-\b\n')");
    testParse(`'test\\"\\'\\u1234-\\b\\n'`, "(Program 'test\"'\u1234-\b\n')");
    testEvalError("'\\h'");
  });
});
