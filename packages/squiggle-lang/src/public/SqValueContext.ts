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

  /* Used for "focus in editor" feature in the playground.
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
    if (this.valueAstIsPrecise) {
      // we can try to look for the next nested valueAst

      // TODO - unwrap binding statements and keyvalue nodes
      while (ast.type === "Block") {
        ast = ast.statements[ast.statements.length - 1];
      }

      switch (ast.type) {
        // FIXME - there are a few O(N^2) here
        case "Program": {
          if (this.path.root === "bindings") {
            // looking in bindings
            for (const statement of ast.statements) {
              if (!isBindingStatement(statement)) {
                continue;
              }
              if (statement.variable.value === item) {
                newAst = statement;
                break;
              }
            }
          }
          break;
        }
        case "Record":
          for (const kv of ast.elements) {
            const { key } = kv;
            if (
              (key.type === "String" || key.type === "Integer") &&
              key.value === item
            ) {
              newAst = kv;
              break;
            }
          }
          break;
        case "Array":
          if (typeof item === "number") {
            const element = ast.elements[item];
            if (element) {
              newAst = element;
            }
          }
          break;
        case "Call":
          // TODO - look in end expression of the lambda that's being called
          break;
      }
    }

    const path = this.path.extend(item);

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
    if (
      !isBindingStatement(this.valueAst) &&
      this.valueAst.type !== "KeyValue"
    ) {
      return;
    }

    const valueStarts = this.valueAst.location.start.offset;
    // TODO - are comments sorted? should we use binary search?
    for (const comment of this.ast.comments) {
      // TODO - filter out line comments?
      const commentEnds = comment.location.end.offset;
      if (commentEnds > valueStarts) {
        continue;
      }
      let ok = true;
      for (let offset = commentEnds; offset < valueStarts; offset++) {
        const char = this.source[offset];
        if (![" ", "\t", "\n"].includes(char)) {
          // doesn't fit
          ok = false;
          break;
        }
      }
      if (ok) {
        return comment.value;
      }
    }
  }
}
