import {
  SqLambda,
  SqNumberValue,
  defaultEnvironment,
} from "../../src/index.js";

describe("SqLambda", () => {
  test("createFromStdlibName", () => {
    const lambda = SqLambda.createFromStdlibName("List.upTo");
    const result = lambda.call(
      [SqNumberValue.create(1), SqNumberValue.create(5)],
      defaultEnvironment
    );

    expect(result.ok).toBe(true);
    expect(result.value.toString()).toBe("[1,2,3,4,5]");
  });

  test("createFromStdlibName for squiggle definition", () => {
    const lambda = SqLambda.createFromStdlibName("RelativeValues.wrap");
    expect(lambda).toBeInstanceOf(SqLambda);
  });

  test("createFromStdlibName for unknown name", () => {
    expect(() => SqLambda.createFromStdlibName("Foo.bar")).toThrow();
  });
});
