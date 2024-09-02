import { type ASTCommentNode, ASTNode } from "@quri/squiggle-lang";

// This doesn't patch children types (e.g. `node.statements[0]` is `ASTNode`, not `PatchedASTNode`)
export type PatchedASTNode = (
  | Exclude<ASTNode, { kind: "Block" }>
  | (Extract<ASTNode, { kind: "Block" }> & { isLambdaBody?: boolean })
) & {
  comments?: ASTCommentNode[];
};

export type SquiggleNode = PatchedASTNode | ASTCommentNode;

// shared between CLI and standalone mode
export type PrettierUtil = {
  isNextLineEmpty(text: string, offset: number): boolean;
};
