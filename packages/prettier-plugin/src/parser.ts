import { type Parser } from "prettier";

import { parse } from "@quri/squiggle-lang";

import { type SquiggleNode } from "./types.js";

export const squiggleParser: Parser<SquiggleNode> = {
  parse: (text) => {
    const parseResult = parse(text);
    if (!parseResult.ok) {
      throw new Error(`Parse failed. ${parseResult.value}`);
    }
    return parseResult.value;
  },
  astFormat: "squiggle-ast",
  locStart: (node: SquiggleNode) => {
    if (!node.location) {
      // can happen when formatWithCursor traverses the tree to find the cursor position
      return -1;
    }
    return node.location.start.offset;
  },
  locEnd: (node: SquiggleNode) => {
    if (!node.location) {
      // can happen when formatWithCursor traverses the tree to find the cursor position
      return -1;
    }
    return node.location.end.offset;
  },
};
