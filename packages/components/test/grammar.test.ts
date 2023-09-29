import { parser } from "../src/languageSupport/generated/squiggle.js";

describe("Lezer grammar", () => {
  test("Basic", () => {
    expect(parser.parse("2+2").toString()).toBe(
      "Program(ArithExpr(Number,ArithOp,Number))"
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
      "Program(Binding(VariableName,Equals,Number),Binding(VariableName,Equals,Number))"
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
      "Program(Binding(VariableName,Equals,Number),Binding(VariableName,Equals,Number),ArithExpr(IdentifierExpr,ArithOp,IdentifierExpr))"
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
      'Program(FunDeclaration(FunctionName,"(",LambdaArgs(LambdaParameter(LambdaParameterName)),")",Equals,IdentifierExpr),CallExpr(IdentifierExpr,"(",Argument(Number),")"))'
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
    ).toBe("Program(Binding(VariableName,Equals,String))");
  });
});
