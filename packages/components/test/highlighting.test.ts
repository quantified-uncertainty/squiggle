import { getStyleTags, Tag, tags } from "@lezer/highlight";

import { hoverableTag } from "../src/components/CodeEditor/languageSupport/highlightingStyle.js";
import { parserWithMetadata } from "../src/components/CodeEditor/languageSupport/squiggle.js";

function testTagsAtPosition(code: string, pos: number, tags: Tag[]) {
  const parsed = parserWithMetadata.parse(code);
  const rule = getStyleTags(parsed.cursorAt(pos, 1));
  expect(rule?.tags).toEqual(tags);
}

describe("Highlighting tests", () => {
  test("Number", () => testTagsAtPosition("v = 123", 4, [tags.integer]));
  test("String", () => testTagsAtPosition('"hello"', 2, [tags.string]));
  test("Keyword", () =>
    testTagsAtPosition("if true then 1 else 2", 0, [tags.keyword]));

  test("Top-level variable", () =>
    testTagsAtPosition("var = 123", 0, [
      hoverableTag,
      tags.constant(tags.variableName),
    ]));

  test("Nested variable is not hoverable", () =>
    testTagsAtPosition("var = { nested = 123; nested }", 9, [
      tags.constant(tags.variableName),
    ]));
});
