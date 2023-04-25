import { testParse } from "../helpers/reducerHelpers.js";

describe("Peggy parse", () => {
  describe("float", () => {
    testParse("1.", "{1}");
    testParse("1.1", "{1.1}");
    testParse(".1", "{0.1}");
    testParse("0.1", "{0.1}");
    testParse("1e1", "{10}");
    testParse("1e-1", "{0.1}");
    testParse(".1e1", "{1}");
    testParse("0.1e1", "{1}");
  });

  describe("literals operators parenthesis", () => {
    testParse("1", "{1}");
    testParse("'hello'", "{'hello'}");
    testParse("true", "{true}");
    testParse("1+2", "{(1 + 2)}");
    testParse("add(1,2)", "{(:add 1 2)}");
    testParse("(1)", "{1}");
    testParse("(1+2)", "{(1 + 2)}");
  });

  describe("unary", () => {
    testParse("-1", "{(-1)}");
    testParse("!true", "{(!true)}");
    testParse("1 + -1", "{(1 + (-1))}");
    testParse("-a[0]", "{(-:a[0])}");
    testParse("!a[0]", "{(!:a[0])}");
  });

  describe("multiplicative", () => {
    testParse("1 * 2", "{(1 * 2)}");
    testParse("1 / 2", "{(1 / 2)}");
    testParse("1 * 2 * 3", "{((1 * 2) * 3)}");
    testParse("1 * 2 / 3", "{((1 * 2) / 3)}");
    testParse("1 / 2 * 3", "{((1 / 2) * 3)}");
    testParse("1 / 2 / 3", "{((1 / 2) / 3)}");
    testParse("1 * 2 + 3 * 4", "{((1 * 2) + (3 * 4))}");
    testParse("1 * 2 - 3 * 4", "{((1 * 2) - (3 * 4))}");
    testParse("1 * 2 .+ 3 * 4", "{((1 * 2) .+ (3 * 4))}");
    testParse("1 * 2 .- 3 * 4", "{((1 * 2) .- (3 * 4))}");
    testParse("1 * 2 + 3 .* 4", "{((1 * 2) + (3 .* 4))}");
    testParse("1 * 2 + 3 / 4", "{((1 * 2) + (3 / 4))}");
    testParse("1 * 2 + 3 ./ 4", "{((1 * 2) + (3 ./ 4))}");
    testParse("1 * 2 - 3 .* 4", "{((1 * 2) - (3 .* 4))}");
    testParse("1 * 2 - 3 / 4", "{((1 * 2) - (3 / 4))}");
    testParse("1 * 2 - 3 ./ 4", "{((1 * 2) - (3 ./ 4))}");
    testParse("1 * 2 - 3 * 4^5", "{((1 * 2) - (3 * (4 ^ 5)))}");
    testParse("1 * 2 - 3 * 4^5^6", "{((1 * 2) - (3 * ((4 ^ 5) ^ 6)))}");
    testParse("1 * -a[-2]", "{(1 * (-:a[(-2)]))}");
  });

  describe("multi-line", () => {
    testParse("x=1; 2", "{:x = {1}; 2}");
    testParse("x=1; y=2", "{:x = {1}; :y = {2}}");
  });

  describe("variables", () => {
    testParse("x = 1", "{:x = {1}}");
    testParse("x", "{:x}");
    testParse("x = 1; x", "{:x = {1}; :x}");
  });

  describe("functions", () => {
    testParse("identity(x) = x", "{:identity = {|:x| {:x}}}"); // Function definitions become lambda assignments
    testParse("identity(x)", "{(:identity :x)}");
  });

  describe("arrays", () => {
    testParse("[]", "{[]}");
    testParse("[0, 1, 2]", "{[0; 1; 2]}");
    testParse("['hello', 'world']", "{['hello'; 'world']}");
    testParse("([0,1,2])[1]", "{[0; 1; 2][1]}");
  });

  describe("records", () => {
    testParse("{a: 1, b: 2}", "{{'a': 1, 'b': 2}}");
    testParse("{1+0: 1, 2+0: 2}", "{{(1 + 0): 1, (2 + 0): 2}}"); // key can be any expression
    testParse("record.property", "{:record.property}");
  });

  describe("post operators", () => {
    //function call, array and record access are post operators with higher priority than unary operators
    testParse("a==!b(1)", "{(:a == (!(:b 1)))}");
    testParse("a==!b[1]", "{(:a == (!:b[1]))}");
    testParse("a==!b.one", "{(:a == (!:b.one))}");
  });

  describe("comments", () => {
    testParse("1 # This is a line comment", "{1}");
    testParse("1 // This is a line comment", "{1}");
    testParse("1 /* This is a multi line comment */", "{1}");
    testParse("/* This is a multi line comment */ 1", "{1}");
    testParse(
      `
  /* This is 
  a multi line 
  comment */
  1`,
      "{1}"
    );
  });

  describe("ternary operator", () => {
    testParse("true ? 2 : 3", "{(::$$_ternary_$$ true 2 3)}");
    testParse(
      "false ? 2 : false ? 4 : 5",
      "{(::$$_ternary_$$ false 2 (::$$_ternary_$$ false 4 5))}"
    ); // nested ternary
  });

  describe("if then else", () => {
    testParse("if true then 2 else 3", "{(::$$_ternary_$$ true {2} {3})}");
    testParse(
      "if false then {2} else {3}",
      "{(::$$_ternary_$$ false {2} {3})}"
    );
    testParse(
      "if false then {2} else if false then {4} else {5}",
      "{(::$$_ternary_$$ false {2} (::$$_ternary_$$ false {4} {5}))}"
    ); //nested if
  });

  describe("logical", () => {
    testParse("true || false", "{(true || false)}");
    testParse("true && false", "{(true && false)}");
    testParse("a * b + c", "{((:a * :b) + :c)}"); // for comparison
    testParse("a && b || c", "{((:a && :b) || :c)}");
    testParse("a && b || c && d", "{((:a && :b) || (:c && :d))}");
    testParse("a && !b || c", "{((:a && (!:b)) || :c)}");
    testParse("a && b==c || d", "{((:a && (:b == :c)) || :d)}");
    testParse("a && b!=c || d", "{((:a && (:b != :c)) || :d)}");
    testParse("a && !(b==c) || d", "{((:a && (!(:b == :c))) || :d)}");
    testParse("a && b>=c || d", "{((:a && (:b >= :c)) || :d)}");
    testParse("a && !(b>=c) || d", "{((:a && (!(:b >= :c))) || :d)}");
    testParse("a && b<=c || d", "{((:a && (:b <= :c)) || :d)}");
    testParse("a && b>c || d", "{((:a && (:b > :c)) || :d)}");
    testParse("a && b<c || d", "{((:a && (:b < :c)) || :d)}");
    testParse("a && b<c[i] || d", "{((:a && (:b < :c[:i])) || :d)}");
    testParse("a && b<c.i || d", "{((:a && (:b < :c.i)) || :d)}");
    testParse("a && b<c(i) || d", "{((:a && (:b < (:c :i))) || :d)}");
    testParse("a && b<1+2 || d", "{((:a && (:b < (1 + 2))) || :d)}");
    testParse("a && b<1+2*3 || d", "{((:a && (:b < (1 + (2 * 3)))) || :d)}");
    testParse(
      "a && b<1+2*-3+4 || d",
      "{((:a && (:b < ((1 + (2 * (-3))) + 4))) || :d)}"
    );
    testParse(
      "a && b<1+2*3 || d ? true : false",
      "{(::$$_ternary_$$ ((:a && (:b < (1 + (2 * 3)))) || :d) true false)}"
    );
  });

  describe("pipe", () => {
    testParse("1 -> add(2)", "{(:add 1 2)}");
    testParse("-1 -> add(2)", "{(:add (-1) 2)}");
    testParse("-a[1] -> add(2)", "{(:add (-:a[1]) 2)}");
    testParse("-f(1) -> add(2)", "{(:add (-(:f 1)) 2)}");
    testParse("1 + 2 -> add(3)", "{(1 + (:add 2 3))}");
    testParse("1 -> add(2) * 3", "{((:add 1 2) * 3)}");
    testParse("1 -> subtract(2)", "{(:subtract 1 2)}");
    testParse("-1 -> subtract(2)", "{(:subtract (-1) 2)}");
    testParse("1 -> subtract(2) * 3", "{((:subtract 1 2) * 3)}");
  });

  describe("elixir pipe", () => {
    //handled together with -> so there is no need for seperate tests
    testParse("1 |> add(2)", "{(:add 1 2)}");
  });

  describe("to", () => {
    testParse("1 to 2", "{(1 to 2)}");
    testParse("-1 to -2", "{((-1) to (-2))}"); // lower than unary
    testParse("a[1] to a[2]", "{(:a[1] to :a[2])}"); // lower than post
    testParse("a.p1 to a.p2", "{(:a.p1 to :a.p2)}"); // lower than post
    testParse("1 to 2 + 3", "{(1 to (2 + 3))}");
    testParse(
      "1->add(2) to 3->add(4) -> add(4)",
      "{((:add 1 2) to (:add (:add 3 4) 4))}"
    ); // lower than chain
  });

  describe("inner block", () => {
    // inner blocks are 0 argument lambdas. They can be used whenever a value is required.
    // Like lambdas they have a local scope.
    testParse("x={y=1; y}; x", "{:x = {:y = {1}; :y}; :x}");
  });

  describe("lambda", () => {
    testParse("{|x| x}", "{{|:x| :x}}");
    testParse("f={|x| x}", "{:f = {|:x| :x}}");
    testParse("f(x)=x", "{:f = {|:x| {:x}}}"); // Function definitions are lambda assignments
    testParse("f(x)=x ? 1 : 0", "{:f = {|:x| {(::$$_ternary_$$ :x 1 0)}}}"); // Function definitions are lambda assignments
  });

  describe("Using lambda as value", () => {
    testParse(
      "myadd(x,y)=x+y; z=myadd; z",
      "{:myadd = {|:x,:y| {(:x + :y)}}; :z = {:myadd}; :z}"
    );
    testParse(
      "myadd(x,y)=x+y; z=[myadd]; z",
      "{:myadd = {|:x,:y| {(:x + :y)}}; :z = {[:myadd]}; :z}"
    );
    testParse(
      "myaddd(x,y)=x+y; z={x: myaddd}; z",
      "{:myaddd = {|:x,:y| {(:x + :y)}}; :z = {{'x': :myaddd}}; :z}"
    );
    testParse("f({|x| x+1})", "{(:f {|:x| (:x + 1)})}");
    testParse("map(arr, {|x| x+1})", "{(:map :arr {|:x| (:x + 1)})}");
    testParse("map([1,2,3], {|x| x+1})", "{(:map [1; 2; 3] {|:x| (:x + 1)})}");
    testParse("[1,2,3]->map({|x| x+1})", "{(:map [1; 2; 3] {|:x| (:x + 1)})}");
  });
  describe("unit", () => {
    testParse("1m", "{(:fromUnit_m 1)}");
    testParse("1M", "{(:fromUnit_M 1)}");
    testParse("1m+2cm", "{((:fromUnit_m 1) + (:fromUnit_cm 2))}");
  });
  describe("Module", () => {
    testParse("x", "{:x}");
    testParse("Math.pi", "{:Math.pi}");
  });
});

describe("parsing new line", () => {
  testParse(
    `
 a + 
 b`,
    "{(:a + :b)}"
  );
  testParse(
    `
 x=
 1`,
    "{:x = {1}}"
  );
  testParse(
    `
 x=1
 y=2`,
    "{:x = {1}; :y = {2}}"
  );
  testParse(
    `
 x={
  y=2;
  y }
 x`,
    "{:x = {:y = {2}; :y}; :x}"
  );
  testParse(
    `
 x={
  y=2
  y }
 x`,
    "{:x = {:y = {2}; :y}; :x}"
  );
  testParse(
    `
 x={
  y=2
  y 
  }
 x`,
    "{:x = {:y = {2}; :y}; :x}"
  );
  testParse(
    `
 x=1
 y=2
 z=3
 `,
    "{:x = {1}; :y = {2}; :z = {3}}"
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
    "{:f = {:x = {1}; :y = {2}; :z = {3}; ((:x + :y) + :z)}}"
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
    "{:f = {:x = {1}; :y = {2}; :z = {3}; ((:x + :y) + :z)}; :g = {(:f + 4)}; :g}"
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
    "{:f = {:x = {1}; :y = {2}; :z = {3}; ((:x + :y) + :z)}; :g = {(:f + 4)}; (:q (:p (:h :g)))}"
  );
  testParse(
    `
  a |>
  b |>
  c |>
  d 
 `,
    "{(:d (:c (:b :a)))}"
  );
  testParse(
    `
  a |>
  b |>
  c |>
  d +
  e
 `,
    "{((:d (:c (:b :a))) + :e)}"
  );
});
