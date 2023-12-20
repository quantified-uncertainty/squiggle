import { parser } from "../src/components/CodeEditor/languageSupport/generated/squiggle.js";

describe("Lezer grammar", () => {
  test("Basic", () => {
    expect(parser.parse("2+2").toString()).toBe(
      "Program(InfixCall(Number,ArithOp,Number))"
    );
  });

  test("Statements only", () => {
    expect(
      parser
        .parse(
          `foo = 5
bar = 6`
        )
        .toString()
    ).toBe(
      "Program(LetStatement(VariableName,Equals,Number),LetStatement(VariableName,Equals,Number))"
    );
  });

  test("Statements with trailing expression", () => {
    expect(
      parser
        .parse(
          `foo = 5
bar = 6
foo + bar`
        )
        .toString()
    ).toBe(
      "Program(LetStatement(VariableName,Equals,Number),LetStatement(VariableName,Equals,Number),InfixCall(IdentifierExpr,ArithOp,IdentifierExpr))"
    );
  });

  test("Function declarations and calls", () => {
    expect(
      parser
        .parse(
          `foo(x) = x
foo(5)`
        )
        .toString()
    ).toBe(
      'Program(DefunStatement(VariableName,"(",LambdaArgs(LambdaParameter(LambdaParameterName)),")",Equals,IdentifierExpr),Call(IdentifierExpr,"(",Argument(Number),")"))'
    );
  });

  // https://github.com/quantified-uncertainty/squiggle/issues/2246
  test("Multiline strings", () => {
    expect(
      parser
        .parse(
          `x = "foo
bar"
`
        )
        .toString()
    ).toBe("Program(LetStatement(VariableName,Equals,String))");
  });

  test("Decorators", () => {
    expect(
      parser
        .parse(
          `@name("X")
x = 5
`
        )
        .toString()
    ).toBe(
      'Program(DecoratedStatement(Decorator(At,DecoratorName,"(",Argument(String),")"),LetStatement(VariableName,Equals,Number)))'
    );
  });

  test("Pipe", () => {
    expect(parser.parse("5 -> max(6)").toString()).toBe(
      'Program(Pipe(Number,ControlOp,Call(IdentifierExpr,"(",Argument(Number),")")))'
    );
  });
});
