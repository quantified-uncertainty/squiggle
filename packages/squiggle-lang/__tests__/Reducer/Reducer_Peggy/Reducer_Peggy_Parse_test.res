open Jest
open Reducer_Peggy_TestHelpers

describe("Peggy parse", () => {
  describe("float", () => {
    testParse("1.", "{1}")
    testParse("1.1", "{1.1}")
    testParse(".1", "{0.1}")
    testParse("0.1", "{0.1}")
    testParse("1e1", "{10}")
    testParse("1e-1", "{0.1}")
    testParse(".1e1", "{1}")
    testParse("0.1e1", "{1}")
  })

  describe("literals operators parenthesis", () => {
    testParse("1", "{1}")
    testParse("'hello'", "{'hello'}")
    testParse("true", "{true}")
    testParse("1+2", "{(:add 1 2)}")
    testParse("add(1,2)", "{(:add 1 2)}")
    testParse("(1)", "{1}")
    testParse("(1+2)", "{(:add 1 2)}")
  })

  describe("unary", () => {
    testParse("-1", "{(:unaryMinus 1)}")
    testParse("!true", "{(:not true)}")
    testParse("1 + -1", "{(:add 1 (:unaryMinus 1))}")
    testParse("-a[0]", "{(:unaryMinus (:$_atIndex_$ :a 0))}")
    testParse("!a[0]", "{(:not (:$_atIndex_$ :a 0))}")
  })

  describe("multiplicative", () => {
    testParse("1 * 2", "{(:multiply 1 2)}")
    testParse("1 / 2", "{(:divide 1 2)}")
    testParse("1 * 2 * 3", "{(:multiply (:multiply 1 2) 3)}")
    testParse("1 * 2 / 3", "{(:divide (:multiply 1 2) 3)}")
    testParse("1 / 2 * 3", "{(:multiply (:divide 1 2) 3)}")
    testParse("1 / 2 / 3", "{(:divide (:divide 1 2) 3)}")
    testParse("1 * 2 + 3 * 4", "{(:add (:multiply 1 2) (:multiply 3 4))}")
    testParse("1 * 2 - 3 * 4", "{(:subtract (:multiply 1 2) (:multiply 3 4))}")
    testParse("1 * 2 .+ 3 * 4", "{(:dotAdd (:multiply 1 2) (:multiply 3 4))}")
    testParse("1 * 2 .- 3 * 4", "{(:dotSubtract (:multiply 1 2) (:multiply 3 4))}")
    testParse("1 * 2 + 3 .* 4", "{(:add (:multiply 1 2) (:dotMultiply 3 4))}")
    testParse("1 * 2 + 3 / 4", "{(:add (:multiply 1 2) (:divide 3 4))}")
    testParse("1 * 2 + 3 ./ 4", "{(:add (:multiply 1 2) (:dotDivide 3 4))}")
    testParse("1 * 2 - 3 .* 4", "{(:subtract (:multiply 1 2) (:dotMultiply 3 4))}")
    testParse("1 * 2 - 3 / 4", "{(:subtract (:multiply 1 2) (:divide 3 4))}")
    testParse("1 * 2 - 3 ./ 4", "{(:subtract (:multiply 1 2) (:dotDivide 3 4))}")
    testParse("1 * 2 - 3 * 4^5", "{(:subtract (:multiply 1 2) (:multiply 3 (:pow 4 5)))}")
    testParse(
      "1 * 2 - 3 * 4^5^6",
      "{(:subtract (:multiply 1 2) (:multiply 3 (:pow (:pow 4 5) 6)))}",
    )
    testParse("1 * -a[-2]", "{(:multiply 1 (:unaryMinus (:$_atIndex_$ :a (:unaryMinus 2))))}")
  })

  describe("multi-line", () => {
    testParse("x=1; 2", "{:x = {1}; 2}")
    testParse("x=1; y=2", "{:x = {1}; :y = {2}}")
  })

  describe("variables", () => {
    testParse("x = 1", "{:x = {1}}")
    testParse("x", "{:x}")
    testParse("x = 1; x", "{:x = {1}; :x}")
  })

  describe("functions", () => {
    testParse("identity(x) = x", "{:identity = {|:x| {:x}}}") // Function definitions become lambda assignments
    testParse("identity(x)", "{(:identity :x)}")
  })

  describe("arrays", () => {
    testParse("[]", "{[]}")
    testParse("[0, 1, 2]", "{[0; 1; 2]}")
    testParse("['hello', 'world']", "{['hello'; 'world']}")
    testParse("([0,1,2])[1]", "{(:$_atIndex_$ [0; 1; 2] 1)}")
  })

  describe("records", () => {
    testParse("{a: 1, b: 2}", "{{'a': 1, 'b': 2}}")
    testParse("{1+0: 1, 2+0: 2}", "{{(:add 1 0): 1, (:add 2 0): 2}}") // key can be any expression
    testParse("record.property", "{(:$_atIndex_$ :record 'property')}")
  })

  describe("post operators", () => {
    //function call, array and record access are post operators with higher priority than unary operators
    testParse("a==!b(1)", "{(:equal :a (:not (:b 1)))}")
    testParse("a==!b[1]", "{(:equal :a (:not (:$_atIndex_$ :b 1)))}")
    testParse("a==!b.one", "{(:equal :a (:not (:$_atIndex_$ :b 'one')))}")
  })

  describe("comments", () => {
    testParse("1 # This is a line comment", "{1}")
    testParse("1 // This is a line comment", "{1}")
    testParse("1 /* This is a multi line comment */", "{1}")
    testParse("/* This is a multi line comment */ 1", "{1}")
    testParse(
      `
  /* This is 
  a multi line 
  comment */
  1`,
      "{1}",
    )
  })

  describe("ternary operator", () => {
    testParse("true ? 2 : 3", "{(::$$_ternary_$$ true 2 3)}")
    testParse(
      "false ? 2 : false ? 4 : 5",
      "{(::$$_ternary_$$ false 2 (::$$_ternary_$$ false 4 5))}",
    ) // nested ternary
  })

  describe("if then else", () => {
    testParse("if true then 2 else 3", "{(::$$_ternary_$$ true {2} {3})}")
    testParse("if false then {2} else {3}", "{(::$$_ternary_$$ false {2} {3})}")
    testParse(
      "if false then {2} else if false then {4} else {5}",
      "{(::$$_ternary_$$ false {2} (::$$_ternary_$$ false {4} {5}))}",
    ) //nested if
  })

  describe("logical", () => {
    testParse("true || false", "{(:or true false)}")
    testParse("true && false", "{(:and true false)}")
    testParse("a * b + c", "{(:add (:multiply :a :b) :c)}") // for comparison
    testParse("a && b || c", "{(:or (:and :a :b) :c)}")
    testParse("a && b || c && d", "{(:or (:and :a :b) (:and :c :d))}")
    testParse("a && !b || c", "{(:or (:and :a (:not :b)) :c)}")
    testParse("a && b==c || d", "{(:or (:and :a (:equal :b :c)) :d)}")
    testParse("a && b!=c || d", "{(:or (:and :a (:unequal :b :c)) :d)}")
    testParse("a && !(b==c) || d", "{(:or (:and :a (:not (:equal :b :c))) :d)}")
    testParse("a && b>=c || d", "{(:or (:and :a (:largerEq :b :c)) :d)}")
    testParse("a && !(b>=c) || d", "{(:or (:and :a (:not (:largerEq :b :c))) :d)}")
    testParse("a && b<=c || d", "{(:or (:and :a (:smallerEq :b :c)) :d)}")
    testParse("a && b>c || d", "{(:or (:and :a (:larger :b :c)) :d)}")
    testParse("a && b<c || d", "{(:or (:and :a (:smaller :b :c)) :d)}")
    testParse("a && b<c[i] || d", "{(:or (:and :a (:smaller :b (:$_atIndex_$ :c :i))) :d)}")
    testParse("a && b<c.i || d", "{(:or (:and :a (:smaller :b (:$_atIndex_$ :c 'i'))) :d)}")
    testParse("a && b<c(i) || d", "{(:or (:and :a (:smaller :b (:c :i))) :d)}")
    testParse("a && b<1+2 || d", "{(:or (:and :a (:smaller :b (:add 1 2))) :d)}")
    testParse("a && b<1+2*3 || d", "{(:or (:and :a (:smaller :b (:add 1 (:multiply 2 3)))) :d)}")
    testParse(
      "a && b<1+2*-3+4 || d",
      "{(:or (:and :a (:smaller :b (:add (:add 1 (:multiply 2 (:unaryMinus 3))) 4))) :d)}",
    )
    testParse(
      "a && b<1+2*3 || d ? true : false",
      "{(::$$_ternary_$$ (:or (:and :a (:smaller :b (:add 1 (:multiply 2 3)))) :d) true false)}",
    )
  })

  describe("pipe", () => {
    testParse("1 -> add(2)", "{(:add 1 2)}")
    testParse("-1 -> add(2)", "{(:add (:unaryMinus 1) 2)}")
    testParse("-a[1] -> add(2)", "{(:add (:unaryMinus (:$_atIndex_$ :a 1)) 2)}")
    testParse("-f(1) -> add(2)", "{(:add (:unaryMinus (:f 1)) 2)}")
    testParse("1 + 2 -> add(3)", "{(:add 1 (:add 2 3))}")
    testParse("1 -> add(2) * 3", "{(:multiply (:add 1 2) 3)}")
    testParse("1 -> subtract(2)", "{(:subtract 1 2)}")
    testParse("-1 -> subtract(2)", "{(:subtract (:unaryMinus 1) 2)}")
    testParse("1 -> subtract(2) * 3", "{(:multiply (:subtract 1 2) 3)}")
  })

  describe("elixir pipe", () => {
    //handled together with -> so there is no need for seperate tests
    testParse("1 |> add(2)", "{(:add 1 2)}")
  })

  describe("to", () => {
    testParse("1 to 2", "{(:credibleIntervalToDistribution 1 2)}")
    testParse("-1 to -2", "{(:credibleIntervalToDistribution (:unaryMinus 1) (:unaryMinus 2))}") // lower than unary
    testParse(
      "a[1] to a[2]",
      "{(:credibleIntervalToDistribution (:$_atIndex_$ :a 1) (:$_atIndex_$ :a 2))}",
    ) // lower than post
    testParse(
      "a.p1 to a.p2",
      "{(:credibleIntervalToDistribution (:$_atIndex_$ :a 'p1') (:$_atIndex_$ :a 'p2'))}",
    ) // lower than post
    testParse("1 to 2 + 3", "{(:credibleIntervalToDistribution 1 (:add 2 3))}")
    testParse(
      "1->add(2) to 3->add(4) -> add(4)",
      "{(:credibleIntervalToDistribution (:add 1 2) (:add (:add 3 4) 4))}",
    ) // lower than chain
  })

  describe("inner block", () => {
    // inner blocks are 0 argument lambdas. They can be used whenever a value is required.
    // Like lambdas they have a local scope.
    testParse("x={y=1; y}; x", "{:x = {:y = {1}; :y}; :x}")
  })

  describe("lambda", () => {
    testParse("{|x| x}", "{{|:x| :x}}")
    testParse("f={|x| x}", "{:f = {|:x| :x}}")
    testParse("f(x)=x", "{:f = {|:x| {:x}}}") // Function definitions are lambda assignments
    testParse("f(x)=x ? 1 : 0", "{:f = {|:x| {(::$$_ternary_$$ :x 1 0)}}}") // Function definitions are lambda assignments
  })

  describe("Using lambda as value", () => {
    testParse(
      "myadd(x,y)=x+y; z=myadd; z",
      "{:myadd = {|:x,:y| {(:add :x :y)}}; :z = {:myadd}; :z}",
    )
    testParse(
      "myadd(x,y)=x+y; z=[myadd]; z",
      "{:myadd = {|:x,:y| {(:add :x :y)}}; :z = {[:myadd]}; :z}",
    )
    testParse(
      "myaddd(x,y)=x+y; z={x: myaddd}; z",
      "{:myaddd = {|:x,:y| {(:add :x :y)}}; :z = {{'x': :myaddd}}; :z}",
    )
    testParse("f({|x| x+1})", "{(:f {|:x| (:add :x 1)})}")
    testParse("map(arr, {|x| x+1})", "{(:map :arr {|:x| (:add :x 1)})}")
    testParse("map([1,2,3], {|x| x+1})", "{(:map [1; 2; 3] {|:x| (:add :x 1)})}")
    testParse("[1,2,3]->map({|x| x+1})", "{(:map [1; 2; 3] {|:x| (:add :x 1)})}")
  })
  describe("unit", () => {
    testParse("1m", "{(:fromUnit_m 1)}")
    testParse("1M", "{(:fromUnit_M 1)}")
    testParse("1m+2cm", "{(:add (:fromUnit_m 1) (:fromUnit_cm 2))}")
  })
  describe("Module", () => {
    testParse("x", "{:x}")
    testParse("Math.pi", "{:Math.pi}")
  })
})

describe("parsing new line", () => {
  testParse(
    `
 a + 
 b`,
    "{(:add :a :b)}",
  )
  testParse(
    `
 x=
 1`,
    "{:x = {1}}",
  )
  testParse(
    `
 x=1
 y=2`,
    "{:x = {1}; :y = {2}}",
  )
  testParse(
    `
 x={
  y=2;
  y }
 x`,
    "{:x = {:y = {2}; :y}; :x}",
  )
  testParse(
    `
 x={
  y=2
  y }
 x`,
    "{:x = {:y = {2}; :y}; :x}",
  )
  testParse(
    `
 x={
  y=2
  y 
  }
 x`,
    "{:x = {:y = {2}; :y}; :x}",
  )
  testParse(
    `
 x=1
 y=2
 z=3
 `,
    "{:x = {1}; :y = {2}; :z = {3}}",
  )
  testParse(
    `
 f={
  x=1
  y=2
  z=3
  x+y+z
 }
 `,
    "{:f = {:x = {1}; :y = {2}; :z = {3}; (:add (:add :x :y) :z)}}",
  )
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
    "{:f = {:x = {1}; :y = {2}; :z = {3}; (:add (:add :x :y) :z)}; :g = {(:add :f 4)}; :g}",
  )
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
    "{:f = {:x = {1}; :y = {2}; :z = {3}; (:add (:add :x :y) :z)}; :g = {(:add :f 4)}; (:q (:p (:h :g)))}",
  )
  testParse(
    `
  a |>
  b |>
  c |>
  d 
 `,
    "{(:d (:c (:b :a)))}",
  )
  testParse(
    `
  a |>
  b |>
  c |>
  d +
  e
 `,
    "{(:add (:d (:c (:b :a))) :e)}",
  )
})
