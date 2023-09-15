import { AST, ASTNode } from "../ast/parse.js";
import { isBindingStatement } from "../ast/utils.js";
import { SqProject } from "./SqProject/index.js";
import { PathItem, SqValuePath } from "./SqValuePath.js";

export class SqValueContext {
  public project: SqProject;
  public sourceId: string;
  public source: string;

  // top-level AST; we pull comments from it for docstrings
  public ast: AST;

  /* Used for "focus in editor" feature in the playground, and for associating values with comments.
   * We try our best to find nested ASTs, but when the value is built dynamically, it's not always possible.
   * In that case, we store the outermost AST and set `valueAstIsPrecise` flag to `false`.
   */
  public valueAst: ASTNode;
  public valueAstIsPrecise: boolean;
  public path: SqValuePath;

  constructor(props: {
    project: SqProject;
    sourceId: string;
    source: string;
    ast: AST;
    valueAst: ASTNode;
    valueAstIsPrecise: boolean;
    path: SqValuePath;
  }) {
    this.project = props.project;
    this.sourceId = props.sourceId;
    this.source = props.source;
    this.ast = props.ast;
    this.valueAst = props.valueAst;
    this.valueAstIsPrecise = props.valueAstIsPrecise;
    this.path = props.path;
  }

  extend(item: PathItem): SqValueContext {
    let ast = this.valueAst;

    let newAst: ASTNode | undefined;
    const itemisNotTableIndexOrCalculator =
      item.type !== "cellAddress" && item.type !== "calculator";

    if (this.valueAstIsPrecise && itemisNotTableIndexOrCalculator) {
      // now we can try to look for the next nested valueAst

      // descend into trivial nodes
      while (true) {
        if (ast.type === "Block") {
          ast = ast.statements[ast.statements.length - 1];
        } else if (ast.type === "KeyValue") {
          ast = ast.value;
        } else if (isBindingStatement(ast)) {
          ast = ast.value;
        } else {
          break;
        }
        // TODO - descend into calls
      }

      switch (ast.type) {
        case "Program": {
          if (this.path.root === "bindings") {
            newAst = ast.symbols[item.value];
            break;
          }
          break;
        }
        case "Dict":
          newAst = ast.symbols[item.value];
          break;
        case "Array":
          if (typeof item === "number") {
            const element = ast.elements[item];
            if (element) {
              newAst = element;
            }
          }
          break;
      }
    }

    return new SqValueContext({
      project: this.project,
      sourceId: this.sourceId,
      source: this.source,
      ast: this.ast,
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

    if (!this.ast.comments.length) {
      return; // no comments
    }

    if (this.path.root === "bindings" && this.path.isRoot()) {
      // This is a comment on first variable, we don't want to duplicate it for top-level bindings dict.
      return;
    }

    const valueStarts = this.valueAst.location.start.offset;

    // Binary search; looking for the last comment that ends before `valueStarts`.
    let a = 0,
      b = this.ast.comments.length - 1;

    while (a < b) {
      const m = Math.floor((a + b) / 2);
      const commentToCheck = this.ast.comments[m + 1];
      if (commentToCheck.location.end.offset > valueStarts) {
        // too far
        b = m;
      } else {
        a = m + 1;
      }
    }

    const comment = this.ast.comments[a];
    const commentEnds = comment.location.end.offset;
    if (commentEnds > valueStarts) {
      return;
    }

    if (comment.type !== "blockComment") {
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
    const ok = this.source.substring(commentEnds, valueStarts).match(/^\s*$/);

    if (ok) {
      return match[1].trim();
    }
  }
}
