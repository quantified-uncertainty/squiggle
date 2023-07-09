import { type ASTCommentNode, type ASTNode } from "@quri/squiggle-lang";

export type SquiggleNode = ASTNode | ASTCommentNode;

// shared between CLI and standalone mode
export type PrettierUtil = {
  isNextLineEmpty(text: string, offset: number): boolean;
};
