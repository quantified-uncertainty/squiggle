import { TypedASTNode } from "../analysis/types.js";
import { isBindingStatement } from "../ast/utils.js";
import { Env } from "../dists/env.js";
import { SqModule } from "./SqProject/SqModule.js";
import { SqValuePath, SqValuePathEdge } from "./SqValuePath.js";

// The common scenario is:
// - you obtain `SqValue` somehow
// - you need to know where it came from, so you query `value.context.runContext`.
export type RunContext = {
  module: SqModule;
  environment: Env;
};

export class SqValueContext {
  public runContext: RunContext;

  /* Used for "focus in editor" feature in the playground, and for associating values with comments.
   * We try our best to find nested ASTs, but when the value is built dynamically, it's not always possible.
   * In that case, we store the outermost AST and set `valueAstIsPrecise` flag to `false`.
   */
  public valueAst: TypedASTNode;
  public valueAstIsPrecise: boolean;
  public path: SqValuePath;

  constructor(props: {
    runContext: RunContext;
    valueAst: TypedASTNode;
    valueAstIsPrecise: boolean;
    path: SqValuePath;
  }) {
    this.runContext = props.runContext;
    this.valueAst = props.valueAst;
    this.valueAstIsPrecise = props.valueAstIsPrecise;
    this.path = props.path;
  }

  extend(item: SqValuePathEdge): SqValueContext {
    let ast = this.valueAst;
    const pathEdge = item.value;

    let newAst: TypedASTNode | undefined;
    const itemisNotTableIndexOrCalculator =
      pathEdge.type !== "cellAddress" && pathEdge.type !== "calculator";

    if (this.valueAstIsPrecise && itemisNotTableIndexOrCalculator) {
      // now we can try to look for the next nested valueAst

      // descend into trivial nodes
      while (true) {
        if (ast.kind === "Block") {
          ast = ast.result;
        } else if (ast.kind === "KeyValue") {
          ast = ast.value;
        } else if (isBindingStatement(ast)) {
          ast = ast.value;
        } else {
          break;
        }
        // TODO - descend into calls
      }

      switch (ast.kind) {
        case "Program": {
          if (this.path.root === "bindings" && pathEdge.type === "key") {
            newAst = ast.symbols[pathEdge.value];
            break;
          }
          break;
        }
        case "Dict":
          if (pathEdge.type === "key") {
            newAst = ast.symbols[pathEdge.value];
          }
          break;
        case "Array":
          if (pathEdge.type === "index") {
            const element = ast.elements[pathEdge.value];
            if (element) {
              newAst = element;
            }
          }
          break;
      }
    }

    return new SqValueContext({
      runContext: this.runContext,
      valueAst: newAst ?? this.valueAst,
      valueAstIsPrecise: Boolean(newAst),
      path: this.path.extend(item),
    });
  }

  findLocation() {
    return this.valueAst.location;
  }

  docstring(): string | undefined {
    if (!this.valueAstIsPrecise) {
      return;
    }

    const ast = this.runContext.module.expectAst();

    if (!ast.comments.length) {
      return; // no comments
    }

    if (this.path.root === "bindings" && this.path.isRoot()) {
      // This is a comment on first variable, we don't want to duplicate it for top-level bindings dict.
      return;
    }

    const valueStarts = this.valueAst.location.start.offset;

    // Binary search; looking for the last comment that ends before `valueStarts`.
    let a = 0,
      b = ast.comments.length - 1;

    while (a < b) {
      const m = Math.floor((a + b) / 2);
      const commentToCheck = ast.comments[m + 1];
      if (commentToCheck.location.end.offset > valueStarts) {
        // too far
        b = m;
      } else {
        a = m + 1;
      }
    }

    const comment = ast.comments[a];
    const commentEnds = comment.location.end.offset;
    if (commentEnds > valueStarts) {
      return;
    }

    if (comment.kind !== "blockComment") {
      return;
    }

    // Check for the starting `*` and remove it.
    // Docstrings must start with `/** */`, like in JSDoc. More than two stars, e.g. `/*** */`, won't work either.
    // TODO: remove the starting `*` for each line.
    const match = comment.value.match(/^\*(?!\*)(.*)/s);
    if (!match) {
      return;
    }

    // Let's check that all text between the comment and the value node is whitespace.
    const ok = this.runContext.module.code
      .substring(commentEnds, valueStarts)
      .match(/^\s*$/);

    if (ok) {
      return match[1].trim();
    }
  }
}
