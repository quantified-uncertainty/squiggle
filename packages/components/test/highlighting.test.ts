import { getStyleTags, Tag, tags } from "@lezer/highlight";

import { hoverableTag } from "../src/components/CodeEditor/languageSupport/highlightingStyle.js";
import { getLezerParser } from "../src/components/CodeEditor/languageSupport/index.js";

const parser = getLezerParser({ hoverableImports: true });

function testTagsAtPosition(code: string, pos: number, tags: Tag[]) {
  const parsed = parser.parse(code);
  const rule = getStyleTags(parsed.cursorAt(pos, 1));
  expect(rule?.tags).toEqual(tags);
}

describe("Highlighting tests", () => {
  test("Number", () => testTagsAtPosition("v = 123", 4, [tags.integer]));
  test("String", () => testTagsAtPosition('"hello"', 2, [tags.string]));
  test("Keyword", () =>
    testTagsAtPosition("if true then 1 else 2", 0, [tags.keyword]));

  test("Top-level variable is hoverable", () =>
    testTagsAtPosition("var = 123", 0, [
      hoverableTag,
      tags.constant(tags.variableName),
    ]));

  test("Top-level variable with tags is hoverable", () => {
    const code = `@foo
@bar
var = 123`;
    testTagsAtPosition(code, code.match(/.*(var)/)?.index ?? -1, [
      hoverableTag,
      tags.constant(tags.variableName),
    ]);
  });

  test("Nested variable is not hoverable", () =>
    testTagsAtPosition("var = { nested = 123; nested }", 9, [
      tags.constant(tags.variableName),
    ]));
});
