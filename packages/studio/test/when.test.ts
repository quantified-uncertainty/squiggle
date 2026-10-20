import { describe, expect, test } from "vitest";

import {
  evaluateWhen,
  parseWhen,
  whenKeys,
  WhenSyntaxError,
} from "../src/client/commands/when.js";

describe("evaluateWhen", () => {
  const ctx = {
    activeFile: "lib/costs.squiggle",
    editorTextFocus: false,
    textInputFocus: true,
    dirtyCount: 2,
    focusRegion: "tree",
    "config.files.autoSave": "afterDelay",
    "squiggle.view": "relative-values",
  };

  test("absent clauses hold", () => {
    expect(evaluateWhen(undefined, ctx)).toBe(true);
    expect(evaluateWhen("", ctx)).toBe(true);
  });

  test("identifiers are truthy or falsy; unknown keys are falsy", () => {
    expect(evaluateWhen("activeFile", ctx)).toBe(true);
    expect(evaluateWhen("editorTextFocus", ctx)).toBe(false);
    expect(evaluateWhen("unknownKey", ctx)).toBe(false);
    expect(evaluateWhen("!unknownKey", ctx)).toBe(true);
  });

  test("boolean operators and precedence", () => {
    expect(evaluateWhen("!editorTextFocus && !textInputFocus", ctx)).toBe(
      false
    );
    expect(evaluateWhen("editorTextFocus || textInputFocus", ctx)).toBe(true);
    // && binds tighter than ||
    expect(
      evaluateWhen("textInputFocus || editorTextFocus && unknownKey", ctx)
    ).toBe(true);
    expect(
      evaluateWhen("(textInputFocus || editorTextFocus) && unknownKey", ctx)
    ).toBe(false);
    expect(evaluateWhen("!!activeFile", ctx)).toBe(true);
  });

  test("comparisons with strings and numbers", () => {
    expect(evaluateWhen("focusRegion == 'tree'", ctx)).toBe(true);
    expect(evaluateWhen("focusRegion != 'tree'", ctx)).toBe(false);
    expect(evaluateWhen("config.files.autoSave != 'off'", ctx)).toBe(true);
    expect(evaluateWhen("squiggle.view == 'relative-values'", ctx)).toBe(true);
    expect(evaluateWhen("dirtyCount > 0", ctx)).toBe(true);
    expect(evaluateWhen("dirtyCount >= 3", ctx)).toBe(false);
    expect(evaluateWhen("dirtyCount < 3 && dirtyCount <= 2", ctx)).toBe(true);
    // Ordering against a non-number is false, never an exception.
    expect(evaluateWhen("focusRegion > 1", ctx)).toBe(false);
    expect(evaluateWhen("unknownKey > 0", ctx)).toBe(false);
  });

  test("literals", () => {
    expect(evaluateWhen("true", ctx)).toBe(true);
    expect(evaluateWhen("false || true", ctx)).toBe(true);
    expect(evaluateWhen("dirtyCount == 2", ctx)).toBe(true);
  });

  test("syntax errors throw", () => {
    expect(() => parseWhen("a &&")).toThrow(WhenSyntaxError);
    expect(() => parseWhen("(a")).toThrow(WhenSyntaxError);
    expect(() => parseWhen("a == 'x")).toThrow(WhenSyntaxError);
    expect(() => parseWhen("a b")).toThrow(WhenSyntaxError);
    expect(() => parseWhen("a = b")).toThrow(WhenSyntaxError);
  });

  test("whenKeys lists the keys a clause reads", () => {
    expect(
      whenKeys("activeFileIsSquiggle && !squiggle.viewHasOwnEditor").sort()
    ).toEqual(["activeFileIsSquiggle", "squiggle.viewHasOwnEditor"]);
    expect(whenKeys("config.files.autoSave != 'off'")).toEqual([
      "config.files.autoSave",
    ]);
  });
});
