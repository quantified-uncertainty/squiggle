import {
  getCodeWarnings,
  getErrorHints,
  suggestBuiltinNames,
} from "../../src/public/hints.js";

describe("suggestBuiltinNames", () => {
  test("same function in another namespace", () => {
    expect(suggestBuiltinNames("List.sum")).toContain("Number.sum");
  });

  test("typo in the same namespace", () => {
    expect(suggestBuiltinNames("List.mapp")).toContain("List.map");
  });
});

describe("getErrorHints", () => {
  test("null", () => {
    expect(getErrorHints({ message: "null is not defined" })[0]).toMatch(
      /no 'null'/
    );
  });

  test("type annotation", () => {
    const hints = getErrorHints({
      message: "Number is not defined",
      line: "f(x: Number) = x",
    });
    expect(hints[0]).toMatch(/Type annotations/);
  });

  test("hash comments", () => {
    const hints = getErrorHints({
      message: 'Expected "(", ... or whitespace but "#" found.',
      line: "# comment",
    });
    expect(hints).toEqual(["Comments use // or /* ... */, not #."]);
  });

  test("no hints for unrelated errors", () => {
    expect(getErrorHints({ message: "Something odd" })).toEqual([]);
  });
});

describe("getCodeWarnings", () => {
  test("clean code", () => {
    expect(getCodeWarnings('x = 1\ny = "null => Infinity"\n// null')).toEqual(
      []
    );
  });

  test("detects common mistakes", () => {
    const warnings = getCodeWarnings(
      [
        "x = 1",
        'import "./a" as a',
        "Y = null",
        "f = (x) => x",
        "<<<<<<< HEAD",
      ].join("\n")
    );
    const lines = warnings.map((w) => w.line);
    expect(lines).toEqual(expect.arrayContaining([2, 3, 4, 5]));
    expect(warnings.find((w) => w.line === 3)?.message).toBeDefined();
  });

  test("ignores code inside strings and comments", () => {
    const warnings = getCodeWarnings(
      [
        'a = "Y = null // not code"',
        "b = 'it\\'s null'",
        'c = "unterminated \\" null',
        "d = 1 /* null */ + /* null */ 2",
        "e = null",
      ].join("\n")
    );
    expect(warnings.map((w) => w.line)).toEqual([5]);
  });

  test("ignores several block comments on a line and one left open", () => {
    const warnings = getCodeWarnings(
      [
        "a = 1 /* null *//* undefined */ + /**/ 2 /* nil",
        "still Infinity in the comment */ b = 2",
        "c = null",
      ].join("\n")
    );
    expect(warnings.map((w) => w.line)).toEqual([3]);
  });

  test("stays fast on pathological input", () => {
    const start = Date.now();
    getCodeWarnings('x = "' + '\\"'.repeat(50000));
    getCodeWarnings("x = 1 " + "/*a".repeat(50000));
    // Many closed block comments on one line: stripping them must not copy the rest of the line once per comment.
    getCodeWarnings("x = 1 " + "/* */".repeat(200000));
    expect(Date.now() - start).toBeLessThan(1000);
  });
});

describe("getErrorHints: bare expressions", () => {
  test("only the final statement may be a bare expression", () => {
    const hints = getErrorHints({
      message: 'Expected "->", assignment, or end of input but "y" found.',
      line: "y = 1",
    });
    expect(hints.join("\n")).toMatch(/Only the final statement/);
  });
});
