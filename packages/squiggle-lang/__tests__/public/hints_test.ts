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
});
