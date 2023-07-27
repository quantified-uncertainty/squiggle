import { run, sq } from "../../src/index.js";
import { SqSampleSetDistribution } from "../../src/public/SqValue/SqDistribution/index.js";
import { testRun } from "../helpers/helpers.js";

describe("SqValue.asJS", () => {
  test("SqDict -> Map", async () => {
    const value = (
      await testRun('{ x: 5, y: [3, "foo", { dist: normal(5,2) } ] }')
    ).asJS();

    expect(value).toBeInstanceOf(Map);
  });

  test("Dict fields", async () => {
    const value = (await testRun("{ x: 5 }")).asJS();

    expect((value as any).get("x")).toBe(5);
  });

  test("Deeply nested dist", async () => {
    const value = (
      await testRun('{ x: 5, y: [3, "foo", { dist: normal(5,2) } ] }')
    ).asJS();

    expect((value as any).get("y")[2].get("dist")).toBeInstanceOf(
      SqSampleSetDistribution
    );
  });
});

describe("docstrings", () => {
  const runToResult = async (code: string) => {
    const outputR = await run(code);
    if (!outputR.ok) {
      throw new Error();
    }
    const { result } = outputR.value;

    return result;
  };

  const runToBindings = async (code: string) => {
    const outputR = await run(code);
    if (!outputR.ok) {
      throw new Error();
    }
    const { bindings } = outputR.value;

    return bindings;
  };

  test("Basic", async () => {
    const bindings = await runToBindings(sq`
/** Docstring */
x = 5
    `);

    expect(bindings.get("x")?.context?.docstring()).toBe("Docstring");
  });

  test("Single star", async () => {
    const bindings = await runToBindings(sq`
/*** Not a docstring */
x = 5
    `);

    expect(bindings.get("x")?.context?.docstring()).toBeUndefined();
  });

  test("Triple star", async () => {
    const bindings = await runToBindings(sq`
/*** Not a docstring */
x = 5
    `);

    expect(bindings.get("x")?.context?.docstring()).toBeUndefined();
  });

  test("Line comment", async () => {
    const bindings = await runToBindings(sq`
// Not a docstring
x = 5
    `);

    expect(bindings.get("x")?.context?.docstring()).toBeUndefined();
  });

  test("Multiple docstrings", async () => {
    const bindings = await runToBindings(sq`
/** First docstring */
x = 5
/** Second docstring */
y = 6
    `);

    expect(bindings.get("x")?.context?.docstring()).toBe("First docstring");
    expect(bindings.get("y")?.context?.docstring()).toBe("Second docstring");
  });

  test("Multiple docstrings for one declaration", async () => {
    const bindings = await runToBindings(sq`
/** First docstring */
/** Second docstring */
x = 5

y = 6
    `);

    expect(bindings.get("x")?.context?.docstring()).toBe("Second docstring");
    expect(bindings.get("y")?.context?.docstring()).toBe(undefined);
  });

  test("Space", async () => {
    const bindings = await runToBindings(sq`
/** docstring */



x = 5
    `);

    expect(bindings.get("x")?.context?.docstring()).toBe("docstring");
  });

  test("No space", async () => {
    const bindings = await runToBindings(sq`
/** docstring */x = 5
    `);

    expect(bindings.get("x")?.context?.docstring()).toBe("docstring");
  });

  test("Long docstring", async () => {
    const bindings = await runToBindings(sq`
/** This
    Docstring
    Is
    Long
   */
x = 5
    `);

    expect(bindings.get("x")?.context?.docstring()).toBe(
      "This\n    Docstring\n    Is\n    Long"
    );
  });

  test("Dict fields", async () => {
    const bindings = await runToBindings(sq`
/** global */
r = {
  /** foo! */
  foo: 5,
  bar: 6,
  /** baz! */
  baz: 7
}
    `);

    const r = bindings.get("r");
    if (r?.tag !== "Dict") {
      throw new Error();
    }

    expect(r.value.context?.docstring()).toBe("global");
    expect(r.value.get("foo")?.context?.docstring()).toBe("foo!");
    expect(r.value.get("bar")?.context?.docstring()).toBe(undefined);
    expect(r.value.get("baz")?.context?.docstring()).toBe("baz!");
  });

  test("Result", async () => {
    const result = await runToResult(sq`
/** x! */
x = 5

/** result */
5
    `);

    expect(result.context?.docstring()).toBe("result");
  });
});
